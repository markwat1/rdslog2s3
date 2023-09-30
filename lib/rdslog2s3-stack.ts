import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {aws_lambda as lambda} from 'aws-cdk-lib';
import { aws_dynamodb as ddb } from 'aws-cdk-lib';
import { DynamoDb,PutItem } from './dynamodb';
import { aws_s3 as s3 } from 'aws-cdk-lib';

export class Rdslog2S3Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const bucket = new s3.Bucket(this,'logBucket',{
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const table = new ddb.TableV2(this,'rdslog2s3-table',{
      partitionKey: { name: 'RdsIdentifier',type: ddb.AttributeType.STRING},
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const testfunc = new lambda.Function(this, 'rdslog2s3', {
      code: lambda.Code.fromAsset('lambda/source'),
      handler: 'rdslog2s3.handler',
      runtime: lambda.Runtime.PYTHON_3_9,
      environment:{
        TABLENAME: table.tableName
      }
    });
    const rdsSetup = new PutItem(this,'rds-info',{
      putName:'RDS1',
      parameters:{
        TableName: table.tableName,
        Item: {
          "RdsIdentifier": {"S": "database-2-instance-1" },
          "S3Bucket": {"S":  bucket.bucketName },
          "lastBackuped" : {"S": ""}
        },
      }
    });
    table.grantFullAccess(testfunc);
    bucket.grantWrite(testfunc);
  }
}
