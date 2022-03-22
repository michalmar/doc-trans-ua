import logging

import azure.functions as func


import os, requests, uuid, json



def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    text = req.params.get('text')
    if not text:
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            text = req_body.get('text')

    fromLang = req.params.get('fromLang')
    if not fromLang:
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            fromLang = req_body.get('fromLang')
    
    toLang = req.params.get('toLang')
    if not toLang:
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            toLang = req_body.get('toLang')
    
    # print(f"fromLang: {fromLang}")
    # print(f"toLang: {toLang}")
    

    subscription_key = os.environ["TRANSLATOR_TEXT_SUBSCRIPTION_KEY"]
    endpoint = os.environ["TRANSLATOR_TEXT_ENDPOINT"]
    location = os.environ["TRANSLATOR_RESOURCE_LOCATION"]

    path = '/translate'
    constructed_url = endpoint + path

    params = {
        'api-version': '3.0',
        'from': fromLang,
        'to': [toLang, 'en']
    }
    headers = {
        'Ocp-Apim-Subscription-Key': subscription_key,
        'Ocp-Apim-Subscription-Region': location,
        'Content-type': 'application/json',
        'X-ClientTraceId': str(uuid.uuid4())
    }
    
    # You can pass more than one object in body.
    body = [{
        'text' : text # text
    }]
    request = requests.post(constructed_url, params=params, headers=headers, json=body)
    response = request.json()

    # print(json.dumps(response, sort_keys=True, indent=4, separators=(',', ': ')))
    ret = json.dumps(response, sort_keys=True, indent=4, separators=(',', ': '))
    return func.HttpResponse(
            ret,
            status_code=200
    )
