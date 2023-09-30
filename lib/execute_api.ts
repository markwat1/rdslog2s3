import cdk = require('aws-cdk-lib');
import { Construct } from 'constructs';
import { custom_resources } from 'aws-cdk-lib';
import { PhysicalResourceId } from 'aws-cdk-lib/custom-resources';

export interface ExecuteApiProps{
    name: string;
    service: string;
    action: string;
    parameters: any;
    responseField: string;
}

export class ExecuteApi extends Construct {
    private response: any;
    constructor(scope: Construct, id: string, props: ExecuteApiProps) {
        super(scope, id);
        const executeApi = new custom_resources.AwsCustomResource(scope, props.name, {
            onCreate: {
                service: props.service,
                action: props.action,
                parameters: props.parameters,
                physicalResourceId: custom_resources.PhysicalResourceId.of(Date.now().toString()),
            },
            onUpdate: {
                service: props.service,
                action: props.action,
                parameters: props.parameters,
                physicalResourceId: custom_resources.PhysicalResourceId.of(Date.now().toString()),
            },
            policy: custom_resources.AwsCustomResourcePolicy.fromSdkCalls({
                resources: custom_resources.AwsCustomResourcePolicy.ANY_RESOURCE,
            }),
        });
        if (props.responseField != "") {
            this.response = executeApi.getResponseField(props.responseField);
            new cdk.CfnOutput(this, 'API_Result', {
                description: 'execute API response',
                value: this.response
            });
        }
    }
    public getResponse() {
        return this.response
    }
}
