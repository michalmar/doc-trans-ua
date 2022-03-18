import React, { useState } from 'react';
import { Stack, Text, Link, FontWeights, IStackTokens, IStackStyles, ITextStyles } from '@fluentui/react';
import logo from './logo.svg';
import './App.css';

import { TextField } from '@fluentui/react/lib/TextField';
// import { lorem } from '@fluentui/example-data';
import { IStackProps } from '@fluentui/react/lib/Stack';

import { DefaultButton, PrimaryButton } from '@fluentui/react/lib/Button';
import { IStyleSet, Label, ILabelStyles, Pivot, PivotItem } from '@fluentui/react';

const boldStyle: Partial<ITextStyles> = { root: { fontWeight: FontWeights.semibold } };

const stackStyles: Partial<IStackStyles> = { root: { width: 650 } };
const stackTokens = { childrenGap: 50 };
const dummyText: string = "aaaa";
const columnProps: Partial<IStackProps> = {
  tokens: { childrenGap: 15 },
  styles: { root: { width: 300 } },
};



const labelStyles: Partial<IStyleSet<ILabelStyles>> = {
  root: { marginTop: 10 },
};

export const App: React.FunctionComponent = () => {

    // helper functions
  const [fileSelected, setFileSelected] = useState(null);
  const [text, setText] = React.useState("Привіт Люба");
  const [textAreaValue, setTextAreaValue] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [processedDocument, setProcessedDocument] = useState(false);
  const [inputKey, setInputKey] = useState(Math.random().toString(36));
  const [translatedResults, setTranslatedResults] = useState(null);
  const [translatedFiles, setTranslatedFiles] = useState(null);

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
    // console.log(translatedResults)
    setProcessed(true)

    // reset state/form
    setFileSelected(null);
    setUploading(false);
    setInputKey(Math.random().toString(36));
  }


  return (
    <Stack horizontalAlign="center" verticalAlign="start" verticalFill styles={stackStyles} tokens={stackTokens}>
      {/* <img className="App-logo" src={logo} alt="logo" /> */}
      <Pivot aria-label="Basic Pivot Example">
        <PivotItem
          headerText="Tranlate text"
          headerButtonProps={{
            'data-order': 1,
            'data-title': 'My Files Title',
          }}
        >
          <Stack {...columnProps}>
            <Label styles={labelStyles}>Text k překladu: (Text v poli níže můžete nahradit libovolným jiným textem)</Label>
            {/* Translation */}
            <TextField label="Váš text" multiline rows={3} value={text} onChange={onTextChange}/>
            <PrimaryButton text="Translate" allowDisabledFocus disabled={uploading} checked={false} onClick={onTranslate}/>
            <TextField label="Překlad" multiline rows={3} value={text}/>
          </Stack>
        </PivotItem>
        <PivotItem headerText="Translate files">
          <Stack {...columnProps}>
            <Label styles={labelStyles}>Nahrajte soubor v CZ (*.docx, *.pdf)</Label>
            <input type="file" accept="application/xml"  />
            <PrimaryButton text="Translate doc" allowDisabledFocus disabled={false} checked={false} />
          </Stack>
        </PivotItem>
      </Pivot>
    </Stack>
  );
};
