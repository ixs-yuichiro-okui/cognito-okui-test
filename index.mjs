// https://stackoverflow.com/questions/61915276/cognitoidentitycredentials-not-providing-access
// https://qiita.com/Shirousa/items/8ef6b691c3150c3e1c38


import { S3Client, ListObjectsCommand  } from '@aws-sdk/client-s3';
import { fromCognitoIdentityPool  } from "@aws-sdk/credential-providers";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";

export const handler = async (event) => {
  console.log(`token; ${event.token}`);
  


  // Access user attributes passed from the Cognito Authorizer
  const claims = event.requestContext.authorizer.claims;
  const userId = claims.sub; // User's unique identifier
  const email = claims.email; // User's email, if included in the token
  const username = claims["cognito:username"];``

  console.log(`event:${JSON.stringify(event)}`)
  console.log(`User ID: ${userId}, Email: ${email}, Username: ${username}`);

  // 'COGNITO_ID' has the format 'cognito-idp.REGION.amazonaws.com/COGNITO_USER_POOL_ID'
  const userPoolId = "cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_cCNpAdnKi";
  const identityPoolId = "ap-northeast-1:f09f8d72-e7c9-4bd6-9bce-0fd53e4ec203";
  const region = 'ap-northeast-1';
  const loginData = {
    [userPoolId]: event.headers.Authorization?.split(' ')[1],
  };
  
  const bucketParams = {
    Bucket: "mytest-okui-bucket",
    Prefix: `${username}/`
  };
  const command = new ListObjectsCommand(bucketParams);

  const cognitoIdentity = {
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({region}),
      identityPoolId: identityPoolId,
      logins: loginData,
    })
  };

  //const credentials = await cognitoIdentity.config.credentials();
  //console.log(credentials);

  const s3Client = new S3Client(cognitoIdentity);
  try {
    const data = await s3Client.send(command);
    console.log("Success", data);
    return {
        statusCode: 200,
        body: JSON.stringify(data.Contents)
    };
  } catch (error) {
    console.error('Error retrieving file:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve file' })
    };
  }
};
