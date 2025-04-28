import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { insightsApi } from '../../services/pluggy/apiAdapter';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

const ChatbotScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [botTyping, setBotTyping] = useState(false);


  const sendMessage = async () => {
    if (!input.trim()) return;
  
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
    };
  
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setBotTyping(true);   // 🟰 Bot starts typing...
  
    try {
      const res = await insightsApi.chatbotQuery(input); 
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: res.reply,
        sender: 'bot',
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't understand. Please try again!",
        sender: 'bot',
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setBotTyping(false);   // 🟰 Bot finished typing...
    }
  };
  

  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessage : styles.botMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
      />

      {botTyping && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ fontStyle: 'italic', color: '#888' }}>Bot is typing...</Text>
        </View>
        )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: '70%',
    padding: 10,
    marginBottom: 10,
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: '#40BEBE',
    alignSelf: 'flex-end',
  },
  botMessage: {
    backgroundColor: '#f1f1f1',
    alignSelf: 'flex-start',
    color: '#000', 
  },
  messageText: {
    color: '#333',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#40BEBE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatbotScreen;
