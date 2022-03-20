import base64
import logging
from nturl2path import url2pathname
import os, uuid, sys
import json, random, string
import azure.functions as func
# from azure.common import AzureException
from azure.storage.blob import BlobClient
import requests

def get_blob_base_url_from_connection_string():
    
    connect_str = os.environ["TRANSLATOR_DOCU_STORAGE_CONNECTION"]
    connect_str_parts = connect_str.split(";")

    url_DefaultEndpointsProtocol = connect_str_parts[0].split("=")[1] # DefaultEndpointsProtocol
    url_AccountName = connect_str_parts[1].split("=")[1] # AccountName
    url_EndpointSuffix = connect_str_parts[3].split("=")[1] # EndpointSuffix

    url_storage = f"{url_DefaultEndpointsProtocol}://{url_AccountName}.blob.{url_EndpointSuffix}"
    return url_storage

def get_unique_filenames(filename, guid, lang_from, lang_to):
    filename_stem = filename.rsplit('.', 1)[0]
    filename_ext = filename.rsplit('.', 1)[1]
    filename_src = f"{filename_stem}___{guid}___{lang_from}.{filename_ext}"
    filename_tgt = f"{filename_stem}___{guid}___{lang_to}.{filename_ext}"
    return (filename_src, filename_tgt)

def translate_doc(filename_src, filename_tgt, lang_from, lang_to):
    TRANSLATOR_DOCU_ENDPOINT = os.environ["TRANSLATOR_DOCU_ENDPOINT"] 
    endpoint = f"{TRANSLATOR_DOCU_ENDPOINT}translator/text/batch/v1.0"
    subscriptionKey =  os.environ["TRANSLATOR_TEXT_SUBSCRIPTION_KEY"]
    path = '/batches'
    constructed_url = endpoint + path

    payload= {
        "inputs": [
            {
                "storageType": "File",
                "source": {
                    "sourceUrl": f"{get_blob_base_url_from_connection_string()}/src/{filename_src}",
                    "language": lang_from
                },
                "targets": [
                    {
                        "targetUrl": f"{get_blob_base_url_from_connection_string()}/tgt/{filename_tgt}.docx",
                        "language": lang_to
                    },
                ]
            }
        ]
    }
    headers = {
    'Ocp-Apim-Subscription-Key': subscriptionKey,
    'Content-Type': 'application/json'
    }

    response = requests.post(constructed_url, headers=headers, json=payload)

    print(f'response status code: {response.status_code}\nresponse status: {response.reason}\nresponse headers: {response.headers}')
    return payload["inputs"][0]["targets"][0]["targetUrl"]

def upload_blob_to_storage(filename, contents):
    # # This is the call to the Form Recognizer endpoint
    connect_str = os.environ["TRANSLATOR_DOCU_STORAGE_CONNECTION"]
    blob_container = os.environ["TRANSLATOR_DOCU_STORAGE_CONTAINER"]
    
    # Storage connection string
    blob = BlobClient.from_connection_string(conn_str=connect_str, container_name=blob_container, blob_name=filename)
    logging.info("Successful connection to blob storage.")

    #upload file to blob storage
    blob.upload_blob(contents)
    logging.info("Successfull blob creating ")



def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    # checking for a POST request.

    LANG_FROM = "cs" 
    LANG_TO = "uk"

    # logging.info(req.get_json())
    for input_file in req.files.values():
        filename = input_file.filename
        contents = input_file.stream.read()

        guid = uuid.uuid1()

        (filename_unique_src, filename_unique_tgt) = get_unique_filenames(filename, guid, lang_from=LANG_FROM, lang_to=LANG_TO)

        logging.info('Filename: %s' % filename)
        logging.info('filename_unique_src: %s' % filename_unique_src)
        logging.info('filename_unique_tgt: %s' % filename_unique_tgt)
       
        upload_blob_to_storage(filename_unique_src, contents)

        translated_doc_url = translate_doc(filename_src=filename_unique_src, 
            filename_tgt=filename_unique_tgt, 
            lang_from=LANG_FROM, 
            lang_to=LANG_TO)
        
        response = {
            "original_filename": filename,
            "translated_filename": filename_unique_tgt, # TODO
            "fileurl": translated_doc_url,
        }
        ret = json.dumps(response, sort_keys=True, indent=4, separators=(',', ': '))
        return func.HttpResponse(
                ret,
                status_code=200
        )
