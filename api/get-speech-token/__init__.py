import logging

import azure.functions as func
import requests
import os
import json

def get_token(subscription_key, region):
        fetch_token_url = f'https://{region}.api.cognitive.microsoft.com/sts/v1.0/issueToken'
        headers = {
            'Ocp-Apim-Subscription-Key': subscription_key
        }
        response = requests.post(fetch_token_url, headers=headers)
        access_token = str(response.text)
        print(access_token)
        return access_token

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    subscription_key = os.environ["SPEECH_KEY"]
    region = os.environ["SPEECH_REGION"]

    token = get_token(subscription_key, region)

    response = {
            "authToken": token,
            "region": region
        }
    ret = json.dumps(response, sort_keys=True, indent=4, separators=(',', ': '))
    return func.HttpResponse(
            ret,
            status_code=200
    )
    