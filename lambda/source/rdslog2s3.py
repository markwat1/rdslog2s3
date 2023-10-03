#! /usr/bin/env python3
import os
import boto3
import argparse
import datetime
import zlib

rds_client = boto3.client('rds')
s3_client = boto3.client('s3')
ddb_client = boto3.client('dynamodb')
MaxRecords = 50


def copy_rds_log_to_s3(db_id,s3_bucket,last_backuped):
    marker=''
    while True:
        response = rds_client.describe_db_log_files(
            DBInstanceIdentifier = db_id,
            MaxRecords = MaxRecords,
            Marker = marker,
        )
        for f in response['DescribeDBLogFiles']:
            if f['LastWritten'] < float(last_backuped) :
                continue;
            r = rds_client.download_db_log_file_portion(
                DBInstanceIdentifier = db_id,
                LogFileName=f['LogFileName'],
                Marker = '0'
            )
            sr = s3_client.list_objects(
                Bucket = s3_bucket,
                Prefix = f['LogFileName'],
            )
            compressed = zlib.compress(bytes(r['LogFileData'], 'utf-8'))
            logFileName = f['LogFileName'] + '.gz'
            if ('Contents' not in sr) or (sr['Contents'][0]['Size'] != len(r['LogFileData'])):
                s3_client.put_object(
                    Body = compressed,
                    Key = logFileName,
                    Bucket = s3_bucket
                )
        if 'Marker' not in response:
            break;
        else:
            marker = response['Marker']

def rdslog2s3(tablename):
    ddb_result = ddb_client.scan(
        TableName = tablename,
        Limit = MaxRecords,
    )
    for rds in ddb_result['Items']:
        db_id = rds['RdsIdentifier']['S']
        s3_bucket = rds['S3Bucket']['S']
        last_backuped = rds['lastBackuped']['S']
        timestamp = datetime.datetime.timestamp(datetime.datetime.now())
        ddb_client.put_item(
            TableName = tablename,
            Item = {
                'RdsIdentifier' : {
                    'S' : db_id
                },
                'S3Bucket' : {
                    'S' : s3_bucket
                },
                'lastBackuped':{
                    'S' : str(timestamp)
                }
            }
        )
        copy_rds_log_to_s3(db_id,s3_bucket,last_backuped)

def handler(event, context):
    rdslog2s3(os.environ['TABLENAME'])

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        prog = 'dblog2s3',
        description = 'copy rds log file into s3')
    parser.add_argument('-t','--tablename',
                        dest = 'tablename',
                        required=True)
    args = parser.parse_args()
    rdslog2s3(args.tablename)
