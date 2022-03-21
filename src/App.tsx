import React, { useState } from 'react';
import { Stack, IStackStyles} from '@fluentui/react';
// import { Stack, Text, Link, FontWeights, IStackTokens, IStackStyles, ITextStyles } from '@fluentui/react';
import logo from './logo.png';
import './App.css';


import { TextField } from '@fluentui/react/lib/TextField';
import { ProgressIndicator } from '@fluentui/react/lib/ProgressIndicator';
// import { lorem } from '@fluentui/example-data';
import { IStackProps } from '@fluentui/react/lib/Stack';

// import { DefaultButton, PrimaryButton } from '@fluentui/react/lib/Button';
import { PrimaryButton, ActionButton } from '@fluentui/react/lib/Button';
import { IIconProps, initializeIcons } from '@fluentui/react';

import { IStyleSet, Label, ILabelStyles, Pivot, PivotItem } from '@fluentui/react';


initializeIcons();
// const boldStyle: Partial<ITextStyles> = { root: { fontWeight: FontWeights.semibold } };

const stackStyles: Partial<IStackStyles> = { root: { width: 650 } };
const stackTokens = { childrenGap: 50 };
// const dummyText: string = "aaaa";
const columnProps: Partial<IStackProps> = {
  tokens: { childrenGap: 15 },
  styles: { root: { width: 300 } },
};



const labelStyles: Partial<IStyleSet<ILabelStyles>> = {
  root: { marginTop: 10 },
};

export const App: React.FunctionComponent = () => {

    // helper functions
  const [fileSelected, setFileSelected] = useState<File| null>();
  const [text, setText] = React.useState("Привіт Люба");
  const [uploading, setUploading] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [processedDocument, setProcessedDocument] = useState(false);
  const [translatedResults, setTranslatedResults] = useState<translateTextResponse>();
  const [translatedFiles, setTranslatedFiles] = useState<translateDocResponse>();

  const addDownloadIcon: IIconProps = { iconName: 'Download' };

  // initializeIcons();

  const sleep = (milliseconds: number) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  // For the "unwrapping" variation


  type translateTextResponse = {
    translations: translateTextResponseRecord[];
  }
  type translateTextResponseRecord = {
    text: string,
    to: string
  }
  type translateDocResponse = {
    fileurl: string,
    original_filename: string,
    translated_filename: string
  }
  function api<T>(url: string, requestOptions: RequestInit): Promise<T[]> {
    return fetch(url, requestOptions)
      .then(response => response.json())
      .then(data => data as T[])
  }
  function api2<T>(url: string, requestOptions: RequestInit): Promise<T> {
    return fetch(url, requestOptions)
      .then(response => response.json())
      .then(data => data as T)
  }

  const onTextChange = React.useCallback(
    (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
      setText(newValue || '');
    },
    [],
  );

  const onTranslate = async () => {
    // prepare UI
    setUploading(true);
    setProcessed(false);

    // *** SEND TEXT TO Azure Functions ***

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "text/plain");

    var requestOptions : RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: '{"text": "'+text+'"}',
      redirect: 'follow'
    };
    
    let data = await api<translateTextResponse>("/api/translate-text-api", requestOptions)
        .then((response) => {
          // console.log("xxx")
          // console.log(response);
          return response;
          
        })
        .catch(error => console.log('error', error));
    // console.log("sssss")
    // console.log(data)
    if (data) {
      // console.log(data[0]);
      setTranslatedResults(data[0]);
    }
    
    setProcessed(true)

    // reset state/form
    setFileSelected(null);
    setUploading(false);
  }
  const onFileChange = React.useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
    setFileSelected(event.currentTarget.files?.item(0));
    
  },[],
  );

  const onFileUpload = async () => {
      // prepare UI
      setUploading(true);
      setProcessedDocument(false);

      // // *** UPLOAD TO AZURE STORAGE ***
      // // const blobsInContainer = await uploadFileToBlob(fileSelected);
      if (fileSelected){
        // *** SEND FILE TO Azure Functions ***
        var formdata = new FormData();
        formdata.append("file", fileSelected, fileSelected.name);

        var requestOptions : RequestInit = {
          method: 'POST',
          body: formdata,
          redirect: 'follow'
        };


        let data = await api2<translateDocResponse>("/api/translate-doc-api", requestOptions)
          .then((response) => {
            // console.log("xxx")
            // console.log(response);
            return response;
            
          })
          .catch(error => console.log('error', error));
        
        if (data) {
          setTranslatedFiles(data)
        }
          
    
        console.log(translatedFiles)
        await sleep(10*1000) //wait 10 seconds
        
        setProcessedDocument(true)
      }
      // reset state/form
      setFileSelected(null);
      setUploading(false);
    };

  function showTranslatedDocumentResult(translatedFiles: translateDocResponse | undefined): React.ReactNode {
    return (
      <Stack>
        
        {/* {translatedFiles?.translated_filename} */}
        <ActionButton iconProps={addDownloadIcon}  href={translatedFiles?.fileurl} target="_blank" >stáhnout přeložený dokument</ActionButton>
      </Stack>
    )
  }

 
 
  return (
    
    <Stack horizontalAlign="center" verticalAlign="start" verticalFill styles={stackStyles} tokens={stackTokens}>
      <img className="App-logo" src={logo} alt="logo" />
      <Pivot aria-label="Basic Pivot Example">
        <PivotItem headerText="Překlad textu (UA->CZ)">
          <Stack {...columnProps}>
            <Label styles={labelStyles}>Text k překladu: (Text v poli níže můžete nahradit libovolným jiným textem)</Label>
            {/* Translation */}
            <TextField label="Váš text" multiline rows={3} value={text} onChange={onTextChange}/>
            <PrimaryButton text="Přeložit" allowDisabledFocus disabled={uploading} checked={false} onClick={onTranslate}/>
            <TextField label="Překlad" multiline rows={3} disabled={!processed} value={translatedResults?.translations[0].text}/>
          </Stack>
        </PivotItem>
        <PivotItem headerText="Přklad dokumentu (CZ -> UA)">
          <Stack {...columnProps}>
            <Label styles={labelStyles}>Nahrajte soubor v CZ (*.docx, *.pdf)</Label>
            <input  name="file" type="file" onChange={onFileChange}  />
            <PrimaryButton text="Přeložit dokument" allowDisabledFocus disabled={uploading} checked={false} onClick={onFileUpload}/>
            {uploading? <ProgressIndicator label="Pracuji..." description="Nahrávám dokument a probíhá překlad." /> : null }
            {processedDocument? showTranslatedDocumentResult(translatedFiles) :null}
          </Stack>
          
        </PivotItem>
      </Pivot>
    </Stack>
  );
};


