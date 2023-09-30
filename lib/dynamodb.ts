import { Construct } from "constructs";
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as execute_api from './execute_api';

export interface Attribute {
  name: string;
  type: dynamodb.AttributeType;
};
export interface Schema {
  primaryKey: Attribute;
  values: Attribute[];
}

export interface DynamoDbProps {
  tableName: string;
  partitionKey: Attribute;
};

export class DynamoDb extends Construct {
  table: dynamodb.Table
  constructor(scope: Construct, id: string, dynamoDbProps: DynamoDbProps) {
    super(scope, id);
    this.table = new dynamodb.Table(this, dynamoDbProps.tableName, {
      partitionKey: {
        name: dynamoDbProps.partitionKey.name,
        type: dynamoDbProps.partitionKey.type
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    new cdk.CfnOutput(this, 'dynamodDB', {
      description: 'DynamoDB ARN',
      value: this.table.tableArn
    });
  }
  public getTable() {
    return this.table;
  }
  
  public getTableArn() {
    return this.table.tableArn;
  }
}
export interface PutItemProps {
  putName:string;
  parameters:{
    TableName: string;
    Item: any;
  }
};

export class PutItem extends Construct {
  constructor(scope: Construct, id: string, putItemProps: PutItemProps) {
    super(scope,id);
    new execute_api.ExecuteApi(this, putItemProps.putName+"ExecuteApi", {
      name: putItemProps.putName,
      service: 'DynamoDB',
      action: 'putItem',
      parameters: putItemProps.parameters,
      responseField: "",
    });
  }
}

