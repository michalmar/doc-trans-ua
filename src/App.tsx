import React, { useState } from 'react';
import { Stack, IStackStyles } from '@fluentui/react';
// import { Stack, Text, Link, FontWeights, IStackTokens, IStackStyles, ITextStyles } from '@fluentui/react';
// import logo from './logo.svg';
import './App.css';


import { TextField } from '@fluentui/react/lib/TextField';
import { ProgressIndicator } from '@fluentui/react/lib/ProgressIndicator';
// import { lorem } from '@fluentui/example-data';
import { IStackProps } from '@fluentui/react/lib/Stack';

// import { DefaultButton, PrimaryButton } from '@fluentui/react/lib/Button';
import { PrimaryButton, ActionButton } from '@fluentui/react/lib/Button';
import { IIconProps, initializeIcons } from '@fluentui/react';
import { IStyleSet, Label, ILabelStyles, Pivot, PivotItem } from '@fluentui/react';

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
  const [translatedResults, setTranslatedResults] = useState<string>("");
  const [translatedFiles, setTranslatedFiles] = useState(null);

  const addDownloadIcon: IIconProps = { iconName: 'Download' };

  initializeIcons();

  const sleep = (milliseconds: number) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
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
    
    await fetch("/api/translate-text-api", requestOptions)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `This is an HTTP error: The status is ${response.status}`
            );
          }
          return response.json();
          
        })
        .then((data) => setTranslatedResults(data))
        .catch(error => console.log('error', error));
    // console.log(JSON.stringify(translatedResults[0]))
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


      await fetch("/api/translate-doc-api", requestOptions)
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `This is an HTTP error: The status is ${response.status}`
              );
            }
            return response.json();
            
          })
          .then((data) => setTranslatedFiles(data))
          .catch(error => console.log('error', error));
      
          console.log(translatedFiles)
          await sleep(10*1000) //wait 10 seconds
          
          setProcessedDocument(true)
    }
    // reset state/form
    setFileSelected(null);
    setUploading(false);
  };



  return (
    
    <Stack horizontalAlign="center" verticalAlign="start" verticalFill styles={stackStyles} tokens={stackTokens}>
      {/* <img className="App-logo" src={logo} alt="logo" /> */}
      <Pivot aria-label="Basic Pivot Example">
        <PivotItem
          headerText="Překlad textu"
          headerButtonProps={{
            'data-order': 1,
            'data-title': 'My Files Title',
          }}
        >
          <Stack {...columnProps}>
            <Label styles={labelStyles}>Text k překladu: (Text v poli níže můžete nahradit libovolným jiným textem)</Label>
            {/* Translation */}
            <TextField label="Váš text" multiline rows={3} value={text} onChange={onTextChange}/>
            <PrimaryButton text="Přeložit" allowDisabledFocus disabled={uploading} checked={false} onClick={onTranslate}/>
            <TextField label="Překlad" multiline rows={3} disabled={processed} value={JSON.stringify(translatedResults[0])}/>
          </Stack>
        </PivotItem>
        <PivotItem headerText="Přklad dokumentu">
          <Stack {...columnProps}>
            <Label styles={labelStyles}>Nahrajte soubor v CZ (*.docx, *.pdf)</Label>
            <input  name="file" type="file" onChange={onFileChange}  />
            <PrimaryButton text="Přeložit dokument" allowDisabledFocus disabled={uploading} checked={false} onClick={onFileUpload}/>
            {uploading? <ProgressIndicator label="Pracuji..." description="Nahrávám dokument a probíhá překlad." /> : null }
            {processedDocument? <TextField label="Přeložený dokuemnt" multiline rows={3} value={JSON.stringify(translatedFiles)}/> :null}
            {processedDocument? <ActionButton iconProps={addDownloadIcon}>stáhnout</ActionButton> : null}

            {/* Přeložený dokument: 
        {translatedFiles.fileurl}
        &nbsp;|&nbsp;{translatedFiles.original_filename}
        &nbsp;|&nbsp;{translatedFiles.translated_filename} */}
          </Stack>
        </PivotItem>
      </Pivot>
    </Stack>
  );
};
