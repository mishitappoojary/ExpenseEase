import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, TextInput, Dimensions, Linking, Image } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { insightsApi } from '../../services/pluggy/apiAdapter';

type SentimentData = {
  spending: Record<string, number>;
  sentiment: {
    twitter: { avg: number; articles: { text: string; url: string }[] };
    news: { avg: number; articles: { title: string; url: string }[] };
  };
  recommendations: string[];
};

const FinancialInsights = () => {
  const [query, setQuery] = useState('tech');
  const [input, setInput] = useState('tech');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SentimentData | null>(null);

  const fetchInsights = async (q: string) => {
    setLoading(true);
    try {
      const result = await insightsApi.getInvestmentRecommendations(q);
      console.log('Fetched Data:', JSON.stringify(result, null, 2));
      setData(result);
    } catch (err) {
      console.error('Error loading investment recommendations:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(query);
  }, [query]);

  const screenWidth = Dimensions.get('window').width;

  const spendingData = data
    ? Object.entries(data.spending || {}).map(([key, value], index) => ({
        name: key,
        amount: value,
        color: `hsl(${index * 50}, 70%, 60%)`,
        legendFontColor: '#333',
        legendFontSize: 14,
      }))
    : [];

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: '#f7f9fc', minHeight: '100%' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#2a2e43' }}>
        📈 Financial Insights
      </Text>

      {/* 🔍 Search Input */}
      <Card style={{ marginBottom: 16, padding: 12 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Enter sector/topic (e.g. Tech, Energy)"
          style={{ borderBottomWidth: 1, marginBottom: 10 }}
        />
        <Button mode="contained" onPress={() => setQuery(input)} style={{ marginTop: 8, backgroundColor: '#40BEBE' }}>
          Search
        </Button>
      </Card>

      {loading && <ActivityIndicator size="large" color="#6200ee" />}
      {!loading && !data && (
        <Card style={{ padding: 20, alignItems: 'center' }}>
          <Text>No insights found. Try a different keyword!</Text>
        </Card>
      )}
      {!loading && data && (
        <>
          {/* 🧾 Spending Overview */}
          <Card style={{ marginBottom: 16 }}>
            <Card.Title title="Your Spending" left={() => <Text>💸</Text>} />
            <Card.Content>
              {spendingData.length > 0 ? (
                <PieChart
                  data={spendingData.map(item => ({
                    name: item.name,
                    population: item.amount,
                    color: item.color,
                    legendFontColor: item.legendFontColor,
                    legendFontSize: item.legendFontSize,
                  }))}
                  width={screenWidth - 32}
                  height={220}
                  chartConfig={{
                    backgroundColor: '#f7f9fc',
                    backgroundGradientFrom: '#f7f9fc',
                    backgroundGradientTo: '#f7f9fc',
                    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              ) : (
                <Text>No spending data available.</Text>
              )}
            </Card.Content>
          </Card>

          {/* 💬 Sentiment Summary */}
          <Card style={{ marginBottom: 16 }}>
            <Card.Title title="Sentiment Analysis" left={() => <Text>🧠</Text>} />
            <Card.Content>
              {/* Twitter Sentiment */}
              <Text
                style={{
                  color: data.sentiment.twitter.avg > 0.2 ? 'green' : data.sentiment.twitter.avg < -0.2 ? 'red' : 'gray'
                }}
              >
                • Twitter Sentiment: {data.sentiment.twitter.avg ? data.sentiment.twitter.avg.toFixed(2) : 'N/A'}
                {data.sentiment.twitter.avg > 0.2 && ' (Positive)'}
                {data.sentiment.twitter.avg < -0.2 && ' (Negative)'}
                {data.sentiment.twitter.avg >= -0.2 && data.sentiment.twitter.avg <= 0.2 && ' (Neutral)'}
              </Text>

              {/* News Sentiment */}
              <Text
                style={{
                  color: data.sentiment.news.avg > 0.2 ? 'green' : data.sentiment.news.avg < -0.2 ? 'red' : 'gray'
                }}
              >
                • News Sentiment: {data.sentiment.news.avg ? data.sentiment.news.avg.toFixed(2) : 'N/A'}
                {data.sentiment.news.avg > 0.2 && ' (Positive)'}
                {data.sentiment.news.avg < -0.2 && ' (Negative)'}
                {data.sentiment.news.avg >= -0.2 && data.sentiment.news.avg <= 0.2 && ' (Neutral)'}
              </Text>
            </Card.Content>
          </Card>

          {/* 📋 Recommendations */}
          <Card style={{ marginBottom: 16 }}>
            <Card.Title title="Our Recommendations" left={() => <Text>📚</Text>} />
            <Card.Content>
              {Array.isArray(data.recommendations) && data.recommendations.length > 0 ? (
                data.recommendations.map((rec, index) => (
                  <Text key={index} style={{ marginVertical: 4 }}>
                    • {rec}
                  </Text>
                ))
              ) : (
                <Text>No recommendations found.</Text>
              )}
            </Card.Content>
          </Card>

          {/* 📰 News Articles */}
          {Array.isArray(data.sentiment.news.articles) && data.sentiment.news.articles.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <Card.Title title="Latest News Articles" left={() => <Text>📰</Text>} />
              <Card.Content>
                {data.sentiment.news.articles.map((article, index) => (
                  <Card key={index} style={{ marginBottom: 8 }} onPress={() => openLink(article.url)}>
                    {article.url && (
                      <Image
                        source={{ uri: `https://s.wordpress.com/mshots/v1/${encodeURIComponent(article.url)}?w=600` }}
                        style={{ width: '100%', height: 150, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
                      />
                    )}
                    <Card.Content>
                      <Text style={{ fontWeight: 'bold' }}>{article.title}</Text>
                    </Card.Content>
                  </Card>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* 🐦 Tweets */}
          {Array.isArray(data.sentiment.twitter.articles) && data.sentiment.twitter.articles.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <Card.Title title="Related Tweets" left={() => <Text>🐦</Text>} />
              <Card.Content>
                {data.sentiment.twitter.articles.map((tweet, index) => (
                  <Card key={index} style={{ marginBottom: 8 }} onPress={() => openLink(tweet.url)}>
                    <Card.Content>
                      <Text style={{ fontWeight: 'bold' }}>{tweet.text}</Text>
                    </Card.Content>
                  </Card>
                ))}
              </Card.Content>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
};

export default FinancialInsights;
