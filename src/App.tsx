import React, { useState } from 'react';
import { Stack, IStackStyles} from '@fluentui/react';
// import { Stack, Text, Link, FontWeights, IStackTokens, IStackStyles, ITextStyles } from '@fluentui/react';
import logo from './logo.png';
import doclogo from './microsoft-translator.jpg'
import './App.css';


import { TextField } from '@fluentui/react/lib/TextField';
import { ProgressIndicator } from '@fluentui/react/lib/ProgressIndicator';
// import { lorem } from '@fluentui/example-data';
import { IStackProps } from '@fluentui/react/lib/Stack';

// import { DefaultButton, PrimaryButton } from '@fluentui/react/lib/Button';
import { PrimaryButton, ActionButton } from '@fluentui/react/lib/Button';
import { IIconProps, initializeIcons } from '@fluentui/react';

import { IStyleSet, Label, ILabelStyles, Pivot, PivotItem } from '@fluentui/react';

import { ChoiceGroup, IChoiceGroupOption } from '@fluentui/react/lib/ChoiceGroup';

import { ResultReason,  
  TranslationRecognizer, 
  TranslationRecognitionEventArgs, 
  SessionEventArgs, 
  TranslationRecognitionResult,
  TranslationRecognitionCanceledEventArgs } from "microsoft-cognitiveservices-speech-sdk";
import Cookie from 'universal-cookie';

import {
  DocumentCard,
  DocumentCardActivity,
  DocumentCardPreview,
  DocumentCardTitle,
  IDocumentCardPreviewProps,
} from '@fluentui/react/lib/DocumentCard';
import { ImageFit } from '@fluentui/react/lib/Image';


const speechsdk = require("microsoft-cognitiveservices-speech-sdk");
const optionsSpeech = [
  { value: "cs", label: "Cestina", translation: "Cesky:" },
  { value: "pl", label: "Polish", translation: "Polish:" },
  { value: "uk", label: "Ukrainian", translation: "Ukrainian:" },
];


const previewProps: IDocumentCardPreviewProps = {
  previewImages: [
    {
      // name: 'Revenue stream proposal fiscal year 2016 version02.pptx',
      linkProps: {
        // href: 'http://bing.com',
        target: '_blank',
      },
      previewImageSrc: doclogo,
      // iconSrc: logo,
      imageFit: ImageFit.cover,
      width: 300,
      // height: 196,
    },
  ],
};
const DocumentCardActivityPeople = [{ name: 'Azure Translator', profileImageSrc: "" }];

initializeIcons();
// const boldStyle: Partial<ITextStyles> = { root: { fontWeight: FontWeights.semibold } };


const options: IChoiceGroupOption[] = [
  { key: 'ukcs', text: 'Ukrajinsky -> Česky' },
  { key: 'csuk', text: 'Česky -> Ukrajinsky' },
];

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

  // constructor(props) {
  //   super(props);

  //   this.state = {
  //     displayText: "INITIALIZED: ready to test speech...",
  //     cs: "",
  //     pl: "",
  //     pt: "",
  //   };
  // }

  const [displayText, setDisplayText] = useState<string>("INITIALIZED: ready to test speech...")
  const [cs, setCS] = useState<string>("nic...");
  // const [speechToken, setSpeechToken] = useState<speechTokenResponse>();
    // helper functions
  const [fileSelected, setFileSelected] = useState<File| null>();
  const [text, setText] = React.useState("Привіт Люба");
  const [uploading, setUploading] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [processedDocument, setProcessedDocument] = useState(false);
  const [translatedResults, setTranslatedResults] = useState<translateTextResponse>();
  const [translatedFiles, setTranslatedFiles] = useState<translateDocResponse>();

  const [fromLang, setFromLang] = useState<string>("uk");
  const [toLang, setToLang] = useState<string>("cs");
  

  const addDownloadIcon: IIconProps = { iconName: 'Download' };

  // initializeIcons();

  const sleep = (milliseconds: number) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  // For the "unwrapping" variation

  type speechTokenResponse = {
    authToken: string,
    region: string
  }

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

  const onChoiceChange = React.useCallback(
    (ev: React.FormEvent<HTMLElement | HTMLInputElement> | undefined, option: IChoiceGroupOption | undefined) => {
      // console.dir(option);
      // way of translation
      if (option?.key === "csuk") {
          setFromLang("cs")
          setToLang("uk")
      } else {
        setFromLang("uk")
        setToLang("cs")
      }
    }, [],

  );

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
      body: '{"text": "'+text+'", "fromLang": "'+fromLang+'", "toLang":"'+toLang+'"}',
      redirect: 'follow',
    };
    
    let data = await api<translateTextResponse>("/api/translate-text-api", requestOptions)
        .then((response) => {
          return response;
          
        })
        .catch(error => console.log('error', error));
  
    if (data) {
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
            return response;
          })
          .catch(error => console.log('error', error));
        
        if (data) {
          setTranslatedFiles(data)
        }
          
        await sleep(10*1000) //wait 10 seconds
        
        setProcessedDocument(true)
      }
      // reset state/form
      setFileSelected(null);
      setUploading(false);
    };

  function showTranslatedDocumentResult(translatedFiles: translateDocResponse | undefined): React.ReactNode {
    let docname = ""
    let href = ""
    if (translatedFiles) {
      docname = translatedFiles?.translated_filename
      href = translatedFiles.fileurl
    }
    return (
      <Stack>
        
        {/* {translatedFiles?.translated_filename} */}
        <ActionButton iconProps={addDownloadIcon}  href={translatedFiles?.fileurl} target="_blank" >stáhnout přeložený dokument</ActionButton>
        <DocumentCard
              aria-label="Default Document Card with large file name..."
              onClickHref={href}
            >
              <DocumentCardPreview {...previewProps} />
              <DocumentCardTitle
                title={docname}
                shouldTruncate
              />
              <DocumentCardActivity activity="Created a few minutes ago" people={DocumentCardActivityPeople} />
            </DocumentCard>
      </Stack>
    )
  }

  async function getToken():Promise<speechTokenResponse>{
    const cookie = new Cookie();
    const speechToken = cookie.get('speech-token');
    
    if (speechToken === undefined) {
      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "text/plain");
  
      var requestOptions : RequestInit = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow',
      };
      
      let data = await api2<speechTokenResponse>("/api/get-speech-token", requestOptions)
          .then((response) => {
            return response;
          })
          .catch(error => console.log('error', error));
    
      if (data) {
        // setSpeechToken(data);
        // console.log("setting cookie..."+data.region)
        cookie.set('speech-token', data.region + ':' + data.authToken, {maxAge: 540, path: '/'});
        return data;
      }
    } else {
        // console.log('Token succcessfullty fetched from cookie');
        const idx = speechToken.indexOf(':');
        return { authToken: speechToken.slice(idx + 1), region: speechToken.slice(0, idx) };
        // setSpeechToken({ authToken: speechToken.slice(idx + 1), region: speechToken.slice(0, idx) })
    }
    return {authToken:"x",region:"x"}; 
  }
 
  const sttFromMic = async () => {
    // this.setState({
    //   displayText: "speak into your microphone...",
    // });
    setDisplayText("speak to mic...")

    

    // const tokenObj = await getTokenOrRefresh();
    let speechToken  = await getToken();

    setDisplayText("token read"+speechToken?.region)
    
    if (speechToken) {
      setDisplayText("token OK, setting config..."+ speechToken.region)
      const speechConfig =
        speechsdk.SpeechTranslationConfig.fromAuthorizationToken(
          speechToken.authToken,
          speechToken.region
        );
      speechConfig.speechRecognitionLanguage = "en-US";
      optionsSpeech.forEach((option) => {
        // console.log("adding: "+option.value);
        speechConfig.addTargetLanguage(option.value);
      });
      
      const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new speechsdk.TranslationRecognizer(
        speechConfig,
        audioConfig
      );
      
      // just a debug events
      recognizer.sessionStarted =  (s: TranslationRecognizer, e: SessionEventArgs)=>{
        console.log("sessionStarted ", e)
      }
      recognizer.sessionStopped =  (s: TranslationRecognizer, e: SessionEventArgs) => {
        console.log("sessionStopped ", e)
      }
      recognizer.speechStartDetected = (s: TranslationRecognizer, e: TranslationRecognitionEventArgs) => {
        console.log("speechStartDetected ")
      }
      recognizer.speechEndDetected = (s: TranslationRecognizer, e: TranslationRecognitionEventArgs) => {
        console.log("speechEndDetected ")
      }
      recognizer.canceled = (s: TranslationRecognizer, e: TranslationRecognitionCanceledEventArgs) => {
        console.log("Cancelled ")
      }

      recognizer.recognizing = (s: TranslationRecognizer, e: TranslationRecognitionEventArgs) => {
        console.log("recognizing ", e);
        let result = "";
        if (
          e.result.reason == ResultReason.RecognizedSpeech
        ) {
          result = `TRANSLATED: Text=${e.result.text}`;
        } else if (e.result.reason == ResultReason.NoMatch) {
          result = "NOMATCH: Speech could not be translated.";
        }
        console.log(result);
        setCS(e.result.translations.get("cs"));
        setDisplayText(e.result.text);
        // this.setState({
        //   cs: e.result.translations.get("cs"),
        //   pl: e.result.translations.get("pl"),
        //   uk: e.result.translations.get("uk"),
        //   displayText: e.result.text,
        // });
      };

      recognizer.recognized = (s:TranslationRecognizer, e: TranslationRecognitionEventArgs) => {
        console.log("recognized ", e);
        setCS(e.result.translations.get("cs"));
        setDisplayText(e.result.text);
        // this.setState({
        //   displayText: `RECOGNIZED: ${e.result.text}`,
        //   cs: e.result.translations.get("cs"),
        //   pl: e.result.translations.get("pl"),
        //   uk: e.result.translations.get("uk"),
        // });
      };

      setDisplayText("starting...")
      // console.dir(recognizer.properties)

      // function recognizeOnceAsync             (cb?: (e: TranslationRecognitionResult) => void, err?: (e: string) => void)
      // function startContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void)
      // recognizer.recognizeOnceAsync(
      //   function(e:TranslationRecognitionResult) {
      //     setDisplayText("recognized once");
      //     setCS(e.translations.get("cs"));
      //   },
      //   function (er:string) {
      //     recognizer.close();
      //     setDisplayText("error om recognition");
      //     // recognizer = undefined;
      //   }
      // );

      recognizer.startContinuousRecognitionAsync(
        function () {
          // recognizer.close();
          setDisplayText("recognition started");
          // recognizer = undefined;
        },
        function (er:string) {
          recognizer.close();
          setDisplayText("error om recognition");
          // recognizer = undefined;
        }
      );

    } else {
      setDisplayText("token not properly initialized, start again...")
    }
  }
 
  return (
    
    <Stack horizontalAlign="center" verticalAlign="start" verticalFill styles={stackStyles} tokens={stackTokens}>
      <img className="App-logo" src={logo} alt="logo" />
      <Pivot aria-label="Basic Pivot Example">
        <PivotItem headerText="Překlad textu">
          <Stack {...columnProps}>
            
            <Label styles={labelStyles}>Text k překladu: (Text v poli níže můžete nahradit libovolným jiným textem)</Label>
            {/* Translation */}
            <TextField label="Váš text" multiline rows={3} value={text} onChange={onTextChange} required={true} />
            <ChoiceGroup defaultSelectedKey="ukcs" options={options} onChange={onChoiceChange} label="Směr překladu" required={true} />
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
        <PivotItem headerText="Speech">
          <Stack {...columnProps}>
            <Label styles={labelStyles}>{displayText}</Label>
            <PrimaryButton text="Start" allowDisabledFocus disabled={uploading} checked={false} onClick={sttFromMic}/>
            {cs}
          </Stack>
          
        </PivotItem>
      </Pivot>
    </Stack>
  );
};


