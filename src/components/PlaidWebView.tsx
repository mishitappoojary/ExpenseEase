// src/components/PlaidWebView.tsx
import React, { useRef } from 'react';
import { WebView } from 'react-native-webview';

interface PlaidWebViewProps {
  linkToken: string;
  onSuccess: (publicToken: string, metadata: any) => void;
  onExit?: (error: any, metadata: any) => void;
}

const PlaidWebView: React.FC<PlaidWebViewProps> = ({ linkToken, onSuccess, onExit }) => {
  const webviewRef = useRef(null);

  const htmlContent = `
    <html>
      <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body>
        <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
        <script>
          var handler = Plaid.create({
            token: "${linkToken}",
            onSuccess: function(public_token, metadata) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', public_token, metadata }));
            },
            onExit: function(err, metadata) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'exit', error: err, metadata }));
            }
          });
          handler.open();
        </script>
      </body>
    </html>
  `;

  const onMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.event === 'success') {
      onSuccess(data.public_token, data.metadata);
    } else if (data.event === 'exit') {
      onExit && onExit(data.error, data.metadata);
    }
  };

  return (
    <WebView
      ref={webviewRef}
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      onMessage={onMessage}
      javaScriptEnabled
    />
  );
};

export default PlaidWebView;
