import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {aws_lambda as lambda} from 'aws-cdk-lib';
import { aws_dynamodb as ddb } from 'aws-cdk-lib';
import { PutItem } from './dynamodb';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';

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
    const rdsAccessRole = new iam.Role(this,'rdsAccessRole',{
      assumedBy:new iam.ServicePrincipal("lambda.amazonaws.com")
    });
    rdsAccessRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonRDSFullAccess"));
    const testfunc = new lambda.Function(this, 'rdslog2s3', {
      code: lambda.Code.fromAsset('lambda/source'),
      handler: 'rdslog2s3.handler',
      runtime: lambda.Runtime.PYTHON_3_9,
      environment:{
        TABLENAME: table.tableName
      },
      role:rdsAccessRole,
    });
    const ddbSetup = new PutItem(this,'rds-info',{
      putName:'RDS1',
      parameters:{
        TableName: table.tableName,
        Item: {
          "RdsIdentifier": {"S": "database-2-instance-1" },
          "S3Bucket": {"S":  bucket.bucketName },
          "lastBackuped" : {"S": "0.0"}
        },
      }
    });
    table.grantFullAccess(testfunc);
    bucket.grantReadWrite(testfunc);
  }
}
