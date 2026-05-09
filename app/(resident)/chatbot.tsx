/**
 * AI Chatbot Screen
 * Beautiful chat interface for residents to interact with eRoyal AI Assistant
 * Powered by Google Gemini API (Free Tier)
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing, Typography } from '../../constants/designSystem';
import { geminiService, ChatMessage } from '../../src/services/geminiService';
import { useAuth } from '../../src/contexts/AuthContext';
import { spacing, fontSize, borderRadius } from '../../src/utils/responsive';

// ── Types ──────────────────────────────────────────────────────
interface DisplayMessage extends ChatMessage {
    isTyping?: boolean;
}

// ── Welcome Message ────────────────────────────────────────────
const WELCOME_MESSAGE: DisplayMessage = {
    id: 'welcome',
    role: 'model',
    text: "Hello! 👋 I'm your eRoyal Assistant.\n\nI can help you with questions about:\n• Society rules & regulations\n• Bills & payments\n• Complaints & maintenance\n• Vehicle management\n• Marketplace guidelines\n• And more!\n\nHow can I help you today?",
    timestamp: new Date(),
};

// ── Quick Suggestion Chips ─────────────────────────────────────
const QUICK_SUGGESTIONS = [
    'Society Rules',
    'Bill Payment Help',
    'File a Complaint',
    'Vehicle Registration',
    'Marketplace Guide',
];

// ── Typing Indicator Component ─────────────────────────────────
function TypingIndicator() {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createAnimation = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            );

        const anim1 = createAnimation(dot1, 0);
        const anim2 = createAnimation(dot2, 200);
        const anim3 = createAnimation(dot3, 400);

        anim1.start();
        anim2.start();
        anim3.start();

        return () => {
            anim1.stop();
            anim2.stop();
            anim3.stop();
        };
    }, []);

    const dotStyle = (animValue: Animated.Value) => ({
        transform: [
            {
                translateY: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6],
                }),
            },
        ],
        opacity: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
        }),
    });

    return (
        <View style={styles.typingContainer}>
            <View style={styles.aiBubbleAvatar}>
                <Ionicons name="sparkles" size={18} color={Colors.primary[600]} />
            </View>
            <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
                <View style={styles.typingDots}>
                    <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
                    <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
                    <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
                </View>
            </View>
        </View>
    );
}

// ── Message Bubble Component ───────────────────────────────────
function MessageBubble({
    message,
    userName,
}: {
    message: DisplayMessage;
    userName: string;
}) {
    const isUser = message.role === 'user';
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const timeString = message.timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <Animated.View
            style={[
                styles.messageRow,
                isUser ? styles.userRow : styles.aiRow,
                {
                    opacity: fadeAnim,
                    transform: [{ translateX: slideAnim }],
                },
            ]}
        >
            {/* AI Avatar */}
            {!isUser && (
                <View style={styles.aiBubbleAvatar}>
                    <Ionicons name="sparkles" size={18} color={Colors.primary[600]} />
                </View>
            )}

            <View style={styles.bubbleWrapper}>
                {/* Sender Name */}
                <Text style={[styles.senderName, isUser ? styles.userSenderName : styles.aiSenderName]}>
                    {isUser ? userName : 'eRoyal Assistant'}
                </Text>

                {/* Message Bubble */}
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
                        {message.text}
                    </Text>
                </View>

                {/* Timestamp */}
                <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
                    {timeString}
                </Text>
            </View>

            {/* User Avatar */}
            {isUser && (
                <View style={styles.userBubbleAvatar}>
                    <Text style={styles.userAvatarText}>
                        {userName.charAt(0).toUpperCase()}
                    </Text>
                </View>
            )}
        </Animated.View>
    );
}

// ── Main Chatbot Screen ────────────────────────────────────────
export default function ChatbotScreen() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();

    const userName = userProfile?.name || 'Resident';

    // Check if API is configured
    const isApiConfigured = geminiService.isConfigured();

    // Handle Android hardware back button
    useEffect(() => {
        if (Platform.OS === 'android') {
            const onBackPress = () => {
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace('/(resident)/home');
                }
                return true;
            };
            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }
    }, [router]);

    /**
     * Scroll to the bottom of the chat
     */
    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, []);

    /**
     * Send a message to the AI
     */
    const handleSend = useCallback(
        async (text?: string) => {
            const messageText = (text || inputText).trim();
            if (!messageText || isLoading) return;

            setError(null);
            setShowSuggestions(false);
            setInputText('');

            // Add user message
            const userMessage: DisplayMessage = {
                id: `user_${Date.now()}`,
                role: 'user',
                text: messageText,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);
            scrollToBottom();

            try {
                const response = await geminiService.sendMessage(messageText);

                const aiMessage: DisplayMessage = {
                    id: `model_${Date.now()}`,
                    role: 'model',
                    text: response,
                    timestamp: new Date(),
                };

                setMessages((prev) => [...prev, aiMessage]);
            } catch (err: any) {
                setError(err.message || 'Something went wrong');
                const errorMessage: DisplayMessage = {
                    id: `error_${Date.now()}`,
                    role: 'model',
                    text: `Error: ${err.message || 'Something went wrong. Please try again.'}`,
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
                scrollToBottom();
            }
        },
        [inputText, isLoading, scrollToBottom]
    );

    /**
     * Handle suggestion chip tap
     */
    const handleSuggestion = useCallback(
        (suggestion: string) => {
            // Remove emoji prefix for cleaner message
            const cleanText = suggestion.replace(/^[^\w]*\s/, '');
            handleSend(`Tell me about ${cleanText}`);
        },
        [handleSend]
    );

    /**
     * Clear chat and start fresh
     */
    const handleClearChat = useCallback(() => {
        geminiService.clearChat();
        setMessages([WELCOME_MESSAGE]);
        setShowSuggestions(true);
        setError(null);
    }, []);

    // ── Render ─────────────────────────────────────────────────
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 40 : 0}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 54 : 12) }]}>
                <TouchableOpacity 
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/(resident)/home');
                        }
                    }} 
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={styles.headerAvatar}>
                        <Ionicons name="sparkles" size={24} color={Colors.primary[600]} />
                        <View style={styles.onlineDot} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>eRoyal Assistant</Text>
                        <Text style={styles.headerSubtitle}>
                            {isLoading ? 'Typing...' : 'Online • AI Powered'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* API Not Configured Warning */}
            {!isApiConfigured && (
                <View style={styles.warningBanner}>
                    <Text style={styles.warningText}>
                        Gemini API key not configured. Please add your key to the .env file.
                    </Text>
                </View>
            )}

            {/* Chat Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <MessageBubble message={item} userName={userName} />
                )}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={scrollToBottom}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                    <>
                        {isLoading && <TypingIndicator />}

                        {/* Quick Suggestions */}
                        {showSuggestions && messages.length <= 1 && (
                            <View style={styles.suggestionsContainer}>
                                <Text style={styles.suggestionsTitle}>Quick Questions</Text>
                                <View style={styles.suggestionsRow}>
                                    {QUICK_SUGGESTIONS.map((suggestion, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.suggestionChip}
                                            onPress={() => handleSuggestion(suggestion)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.suggestionText}>{suggestion}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </>
                }
            />

            {/* Input Bar */}
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Ask me anything about eRoyal..."
                        placeholderTextColor={Colors.text.tertiary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                        editable={!isLoading && isApiConfigured}
                        onSubmitEditing={() => handleSend()}
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                        ]}
                        onPress={() => handleSend()}
                        disabled={!inputText.trim() || isLoading}
                        activeOpacity={0.7}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="send" size={18} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>
                <Text style={styles.poweredBy}>Powered by Google Gemini AI</Text>
            </View>
        </KeyboardAvoidingView>
    );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4F8',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary[600],
        paddingBottom: 14,
        paddingHorizontal: 16,
        ...Shadows.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 22,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    headerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    headerAvatarEmoji: {
        fontSize: 22,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: Colors.primary[600],
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 1,
    },
    clearButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearIcon: {
        fontSize: 18,
    },

    // Warning
    warningBanner: {
        backgroundColor: '#FEF3C7',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#FDE68A',
    },
    warningText: {
        color: '#92400E',
        fontSize: 13,
        textAlign: 'center',
        fontWeight: '500',
    },

    // Messages
    messageList: {
        paddingHorizontal: 12,
        paddingVertical: 16,
        paddingBottom: 8,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    userRow: {
        justifyContent: 'flex-end',
    },
    aiRow: {
        justifyContent: 'flex-start',
    },
    aiBubbleAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E8F0FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 18,
    },
    avatarEmoji: {
        fontSize: 16,
    },
    userBubbleAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary[600],
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
        marginBottom: 18,
    },
    userAvatarText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    bubbleWrapper: {
        maxWidth: '72%',
    },
    senderName: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 3,
    },
    userSenderName: {
        color: Colors.primary[600],
        textAlign: 'right',
    },
    aiSenderName: {
        color: Colors.text.secondary,
        textAlign: 'left',
    },
    messageBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    userBubble: {
        backgroundColor: Colors.primary[600],
        borderBottomRightRadius: 4,
        ...Shadows.sm,
    },
    aiBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: '#E8ECF0',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 21,
    },
    userText: {
        color: '#FFFFFF',
    },
    aiText: {
        color: Colors.text.primary,
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
    },
    userTimestamp: {
        color: Colors.text.tertiary,
        textAlign: 'right',
    },
    aiTimestamp: {
        color: Colors.text.tertiary,
        textAlign: 'left',
    },

    // Typing Indicator
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    typingBubble: {
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    typingDots: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary[400],
    },

    // Suggestions
    suggestionsContainer: {
        paddingHorizontal: 4,
        paddingTop: 8,
        paddingBottom: 16,
    },
    suggestionsTitle: {
        fontSize: 13,
        color: Colors.text.secondary,
        fontWeight: '600',
        marginBottom: 10,
        textAlign: 'center',
    },
    suggestionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    suggestionChip: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: Colors.primary[200],
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 9,
        ...Shadows.sm,
    },
    suggestionText: {
        fontSize: 13,
        color: Colors.primary[600],
        fontWeight: '500',
    },

    // Input
    inputContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        borderTopWidth: 1,
        borderTopColor: '#E8ECF0',
        ...Shadows.lg,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F5F7FA',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        paddingLeft: 16,
        paddingRight: 4,
        paddingVertical: 4,
        minHeight: 48,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        color: Colors.text.primary,
        maxHeight: 100,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        lineHeight: 20,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary[600],
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: Colors.primary[200],
    },
    sendIcon: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    poweredBy: {
        fontSize: 10,
        color: Colors.text.tertiary,
        textAlign: 'center',
        marginTop: 6,
    },
});
