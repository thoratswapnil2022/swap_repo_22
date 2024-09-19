import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class MyNewCdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket for the website
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,  // Automatically deletes on stack removal
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,  // Adjust this if needed
    });

    // Add a bucket policy to allow public read access
    websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${websiteBucket.bucketArn}/*`],
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal()],
    }));

    // Create a CloudFront distribution to serve the content over HTTPS
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'WebsiteDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: websiteBucket
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });

    // Deploy the website content to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./website-content')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],  // Invalidate CloudFront cache
    });
  }
}
