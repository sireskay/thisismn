'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card';
import { Input } from '@ui/components/input';
import { Avatar, AvatarFallback } from '@ui/components/avatar';
import { Send, Bot, User, Loader2, X, Sparkles, Building, Calendar, MapPin, Star } from 'lucide-react';
import { apiClient } from '@shared/lib/api-client';
import Link from 'next/link';
import { format } from 'date-fns';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: Array<{
    type: 'business' | 'event' | 'action';
    data: any;
  }>;
}

interface AIAssistantProps {
  businessContext?: {
    id: string;
    name: string;
    category: string;
  };
  onClose?: () => void;
}

export function AIAssistant({ businessContext, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: businessContext 
        ? `Hi! I'm here to help you learn more about ${businessContext.name}. What would you like to know?`
        : 'Hi! I am your AI assistant for the Minnesota Business Directory. I can help you find businesses, events, and answer questions about local AI-focused companies. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const api = apiClient as any;
      const response = await api['directory-ai'].chat.$post({
        json: {
          messages: messages.concat(userMessage).map(m => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            type: 'directory',
            businessId: businessContext?.id,
            category: businessContext?.category,
          },
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          suggestions: data.suggestions,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or rephrase your question.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderSuggestion = (suggestion: any) => {
    switch (suggestion.type) {
      case 'business':
        return (
          <Card key={suggestion.data.id} className="mb-2">
            <CardContent className="p-3">
              <Link href={`/directory/${suggestion.data.slug}`} className="block hover:bg-muted rounded p-2 -m-2">
                <div className="flex items-start gap-2">
                  <Building className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <h4 className="font-semibold text-sm">{suggestion.data.name}</h4>
                    <p className="text-xs text-muted-foreground">{suggestion.data.category}</p>
                    {suggestion.data.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{suggestion.data.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        );

      case 'event':
        return (
          <Card key={suggestion.data.id} className="mb-2">
            <CardContent className="p-3">
              <Link href={`/events/${suggestion.data.id}`} className="block hover:bg-muted rounded p-2 -m-2">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <h4 className="font-semibold text-sm">{suggestion.data.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(suggestion.data.startDate), 'MMM d, yyyy')}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs">{suggestion.data.location}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        );

      case 'action':
        return (
          <Button key={suggestion.data.id} variant="outline" size="sm" className="mb-2 mr-2" asChild>
            <Link href={suggestion.data.url}>{suggestion.data.label}</Link>
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Business Assistant</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 px-6 overflow-y-auto" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3">
                      {message.suggestions.map(renderSuggestion)}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(message.timestamp, 'h:mm a')}
                  </p>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about businesses, events, or services..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInput('Find AI consultants near me')}
              className="text-xs"
            >
              AI Consultants
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInput('Show upcoming tech events')}
              className="text-xs"
            >
              Tech Events
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInput('Best rated businesses')}
              className="text-xs"
            >
              Top Rated
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}