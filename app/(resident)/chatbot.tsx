/**
 * AI Chatbot Screen
 * eRoyal AI Assistant — bilingual (English + اردو) with auto-detect
 * Language dropdown in header lets user switch modes at any time
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
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/designSystem';
import { geminiService, ChatMessage, Language } from '../../src/services/geminiService';
import { useAuth } from '../../src/contexts/AuthContext';

// ── Types ───────────────────────────────────────────────────────
interface DisplayMessage extends ChatMessage {
    isTyping?: boolean;
}

// ── Language config ──────────────────────────────────────────────
interface LangOption {
    value: Language;
    label: string;
    flag: string;
    desc: string;
}
const LANG_OPTIONS: LangOption[] = [
    { value: 'auto', label: 'Auto Detect', flag: '🤖', desc: 'Replies in your language automatically' },
    { value: 'en',   label: 'English',     flag: '🇬🇧', desc: 'Always reply in English' },
    { value: 'ur',   label: 'اردو',        flag: '🇵🇰', desc: 'ہمیشہ اردو میں جواب دیں' },
];

// Detect Urdu/Arabic characters in a string
const hasUrdu = (text: string) => /[\u0600-\u06FF]/.test(text);

// Welcome message per language
const getWelcome = (lang: Language): DisplayMessage => ({
    id: 'welcome',
    role: 'model',
    timestamp: new Date(),
    text: lang === 'ur'
        ? 'السلام علیکم! 👋 میں آپ کا eRoyal اسسٹنٹ ہوں۔\n\nمیں آپ کی مدد کر سکتا ہوں:\n• معاشرے کے قوانین\n• بل اور ادائیگی\n• شکایات اور مرمت\n• گاڑی کا انتظام\n• مارکیٹ پلیس\n• گیٹ اور سیکیورٹی\n\nآج میں آپ کی کیا مدد کر سکتا ہوں؟'
        : lang === 'en'
        ? "Hello! 👋 I'm your eRoyal Assistant.\n\nI can help you with:\n• Society rules & regulations\n• Bills & payments\n• Complaints & maintenance\n• Vehicle management\n• Marketplace guidelines\n• Gate & security\n\nHow can I help you today?"
        : "Hello! 👋 I'm your eRoyal Assistant.\n\nWrite in English or اردو — I'll reply in your language automatically!\n\nI can help with society rules, bills, complaints, vehicles, marketplace, gate & security, and more.",
});

// Quick suggestion chips per language
const getSuggestions = (lang: Language): string[] =>
    lang === 'ur'
        ? ['قوانین و ضوابط', 'بل کی ادائیگی', 'شکایت درج کریں', 'گاڑی رجسٹریشن', 'مارکیٹ پلیس', 'گیٹ کا طریقہ']
        : ['Society Rules', 'Bill Payment Help', 'File a Complaint', 'Vehicle Registration', 'Marketplace Guide', 'Gate Procedures'];

// ── Typing Indicator ─────────────────────────────────────────────
function TypingIndicator() {
    const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

    useEffect(() => {
        const anims = dots.map((dot, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 200),
                    Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
                ])
            )
        );
        anims.forEach(a => a.start());
        return () => anims.forEach(a => a.stop());
    }, []);

    return (
        <View style={styles.typingContainer}>
            <View style={styles.aiBubbleAvatar}>
                <Ionicons name="sparkles" size={18} color={Colors.primary[600]} />
            </View>
            <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
                <View style={styles.typingDots}>
                    {dots.map((dot, i) => (
                        <Animated.View
                            key={i}
                            style={[styles.typingDot, {
                                transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
                                opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                            }]}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}

// ── Message Bubble ────────────────────────────────────────────────
const MessageBubble = React.memo(function MessageBubble({
    message,
    userName,
    language,
}: {
    message: DisplayMessage;
    userName: string;
    language: Language;
}) {
    const isUser = message.role === 'user';
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
    }, []);

    // RTL: forced in Urdu mode; auto-detected in auto mode
    const isRTL = !isUser && (language === 'ur' || (language === 'auto' && hasUrdu(message.text)));
    const timeString = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <Animated.View style={[
            styles.messageRow,
            isUser ? styles.userRow : styles.aiRow,
            { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
        ]}>
            {!isUser && (
                <View style={styles.aiBubbleAvatar}>
                    <Ionicons name="sparkles" size={18} color={Colors.primary[600]} />
                </View>
            )}
            <View style={styles.bubbleWrapper}>
                <Text style={[styles.senderName, isUser ? styles.userSenderName : styles.aiSenderName]}>
                    {isUser ? userName : 'eRoyal Assistant'}
                </Text>
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                    <Text style={[
                        styles.messageText,
                        isUser ? styles.userText : styles.aiText,
                        isRTL && styles.rtlText,
                    ]}>
                        {message.text}
                    </Text>
                </View>
                <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
                    {timeString}
                </Text>
            </View>
            {isUser && (
                <View style={styles.userBubbleAvatar}>
                    <Text style={styles.userAvatarText}>{userName.charAt(0).toUpperCase()}</Text>
                </View>
            )}
        </Animated.View>
    );
});

// ── Language Dropdown ─────────────────────────────────────────────
function LanguageDropdown({ visible, current, onSelect, onClose }: {
    visible: boolean;
    current: Language;
    onSelect: (lang: Language) => void;
    onClose: () => void;
}) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.dropdownBackdrop} onPress={onClose}>
                <Pressable style={styles.dropdownCard} onPress={() => { /* prevent backdrop close */ }}>
                    <Text style={styles.dropdownTitle}>Choose Language</Text>
                    {LANG_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.dropdownOption, current === opt.value && styles.dropdownOptionActive]}
                            onPress={() => { onSelect(opt.value); onClose(); }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.dropdownFlag}>{opt.flag}</Text>
                            <View style={styles.dropdownText}>
                                <Text style={[styles.dropdownLabel, current === opt.value && styles.dropdownLabelActive]}>
                                    {opt.label}
                                </Text>
                                <Text style={styles.dropdownDesc}>{opt.desc}</Text>
                            </View>
                            {current === opt.value && (
                                <Ionicons name="checkmark-circle" size={20} color={Colors.primary[600]} />
                            )}
                        </TouchableOpacity>
                    ))}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ── Main Screen ───────────────────────────────────────────────────
export default function ChatbotScreen() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);

    const [language, setLang] = useState<Language>('auto');
    const [langDropdownVisible, setLangDropdownVisible] = useState(false);
    const [messages, setMessages] = useState<DisplayMessage[]>([getWelcome('auto')]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);

    const userName = userProfile?.name || 'Resident';
    const isApiConfigured = geminiService.isConfigured();

    const currentLangOption = LANG_OPTIONS.find(o => o.value === language)!;

    // Android hardware back
    useEffect(() => {
        if (Platform.OS !== 'android') return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            router.canGoBack() ? router.back() : router.replace('/(resident)/home');
            return true;
        });
        return () => sub.remove();
    }, [router]);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, []);

    // Change language: reset service + show new welcome message
    const handleLanguageChange = useCallback((lang: Language) => {
        setLang(lang);
        geminiService.setLanguage(lang);
        geminiService.clearChat();
        setMessages([getWelcome(lang)]);
        setShowSuggestions(true);
        setInputText('');
    }, []);

    const handleSend = useCallback(async (text?: string) => {
        const messageText = (text || inputText).trim();
        if (!messageText || isLoading) return;

        setShowSuggestions(false);
        setInputText('');

        const userMsg: DisplayMessage = {
            id: `user_${Date.now()}`,
            role: 'user',
            text: messageText,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        scrollToBottom();

        try {
            const response = await geminiService.sendMessage(messageText);
            setMessages(prev => [...prev, {
                id: `model_${Date.now()}`,
                role: 'model',
                text: response,
                timestamp: new Date(),
            }]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                id: `error_${Date.now()}`,
                role: 'model',
                text: `⚠️ ${err.message || 'Something went wrong. Please try again.'}`,
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
            scrollToBottom();
        }
    }, [inputText, isLoading, scrollToBottom]);

    const handleSuggestion = useCallback((s: string) => {
        handleSend(language === 'ur' ? s : `Tell me about ${s}`);
    }, [handleSend, language]);

    const handleClear = useCallback(() => {
        geminiService.clearChat();
        setMessages([getWelcome(language)]);
        setShowSuggestions(true);
    }, [language]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 40 : 0}
        >
            {/* ── Header ── */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 54 : 12) }]}>
                {/* Back */}
                <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/(resident)/home')}
                >
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>

                {/* Center */}
                <View style={styles.headerCenter}>
                    <View style={styles.headerAvatar}>
                        <Ionicons name="sparkles" size={22} color={Colors.primary[600]} />
                        <View style={styles.onlineDot} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>eRoyal Assistant</Text>
                        <Text style={styles.headerSubtitle}>
                            {isLoading ? 'Typing...' : `${currentLangOption.flag} ${currentLangOption.label} • AI Powered`}
                        </Text>
                    </View>
                </View>

                {/* Language dropdown trigger */}
                <TouchableOpacity style={styles.headerIconBtn} onPress={() => setLangDropdownVisible(true)}>
                    <Text style={styles.langFlag}>{currentLangOption.flag}</Text>
                </TouchableOpacity>

                {/* Clear */}
                <TouchableOpacity style={styles.headerIconBtn} onPress={handleClear}>
                    <Ionicons name="refresh" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* ── API Warning ── */}
            {!isApiConfigured && (
                <View style={styles.warningBanner}>
                    <Text style={styles.warningText}>
                        ⚠️ Gemini API key not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.
                    </Text>
                </View>
            )}

            {/* ── Messages ── */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <MessageBubble message={item} userName={userName} language={language} />
                )}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={scrollToBottom}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                    <>
                        {isLoading && <TypingIndicator />}
                        {showSuggestions && messages.length <= 1 && (
                            <View style={styles.suggestionsContainer}>
                                <Text style={styles.suggestionsTitle}>
                                    {language === 'ur' ? 'فوری سوالات' : 'Quick Questions'}
                                </Text>
                                <View style={styles.suggestionsRow}>
                                    {getSuggestions(language).map((s, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            style={styles.suggestionChip}
                                            onPress={() => handleSuggestion(s)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.suggestionText}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </>
                }
            />

            {/* ── Input ── */}
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.textInput}
                        placeholder={language === 'ur' ? 'یہاں سوال لکھیں...' : 'Ask me anything about eRoyal...'}
                        placeholderTextColor="#94A3B8"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                        editable={!isLoading && isApiConfigured}
                        onSubmitEditing={() => handleSend()}
                        blurOnSubmit={false}
                        textAlign={language === 'ur' ? 'right' : 'left'}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                        onPress={() => handleSend()}
                        disabled={!inputText.trim() || isLoading}
                        activeOpacity={0.7}
                    >
                        {isLoading
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Ionicons name="send" size={18} color="#fff" />
                        }
                    </TouchableOpacity>
                </View>
                <Text style={styles.poweredBy}>Powered by Google Gemini AI</Text>
            </View>

            {/* ── Language Dropdown ── */}
            <LanguageDropdown
                visible={langDropdownVisible}
                current={language}
                onSelect={handleLanguageChange}
                onClose={() => setLangDropdownVisible(false)}
            />
        </KeyboardAvoidingView>
    );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary[600],
        paddingBottom: 14,
        paddingHorizontal: 8,
        gap: 4,
        ...Shadows.md,
    },
    headerIconBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    langFlag: { fontSize: 20 },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
    headerAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 10,
    },
    onlineDot: {
        position: 'absolute', bottom: 1, right: 1,
        width: 11, height: 11, borderRadius: 6,
        backgroundColor: '#22C55E',
        borderWidth: 2, borderColor: Colors.primary[600],
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },

    // Warning
    warningBanner: {
        backgroundColor: '#FEF3C7',
        paddingVertical: 8, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#FDE68A',
    },
    warningText: { color: '#92400E', fontSize: 12, textAlign: 'center', fontWeight: '500' },

    // Messages
    messageList: { paddingHorizontal: 12, paddingVertical: 16, paddingBottom: 8 },
    messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
    userRow: { justifyContent: 'flex-end' },
    aiRow: { justifyContent: 'flex-start' },
    aiBubbleAvatar: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#E8F0FE',
        justifyContent: 'center', alignItems: 'center',
        marginRight: 8, marginBottom: 18,
    },
    userBubbleAvatar: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: Colors.primary[600],
        justifyContent: 'center', alignItems: 'center',
        marginLeft: 8, marginBottom: 18,
    },
    userAvatarText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    bubbleWrapper: { maxWidth: '72%' },
    senderName: { fontSize: 11, fontWeight: '600', marginBottom: 3 },
    userSenderName: { color: Colors.primary[600], textAlign: 'right' },
    aiSenderName: { color: '#64748B', textAlign: 'left' },
    messageBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
    userBubble: { backgroundColor: Colors.primary[600], borderBottomRightRadius: 4, ...Shadows.sm },
    aiBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, ...Shadows.sm, borderWidth: 1, borderColor: '#E8ECF0' },
    messageText: { fontSize: 15, lineHeight: 22 },
    userText: { color: '#fff' },
    aiText: { color: '#1E293B' },
    rtlText: { textAlign: 'right', writingDirection: 'rtl' },
    timestamp: { fontSize: 10, marginTop: 4 },
    userTimestamp: { color: '#94A3B8', textAlign: 'right' },
    aiTimestamp: { color: '#94A3B8', textAlign: 'left' },

    // Typing
    typingContainer: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
    typingBubble: { paddingHorizontal: 18, paddingVertical: 14 },
    typingDots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary[400] },

    // Suggestions
    suggestionsContainer: { paddingHorizontal: 4, paddingTop: 8, paddingBottom: 16 },
    suggestionsTitle: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 10, textAlign: 'center' },
    suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    suggestionChip: {
        backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.primary[200],
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, ...Shadows.sm,
    },
    suggestionText: { fontSize: 13, color: Colors.primary[600], fontWeight: '500' },

    // Input
    inputContainer: {
        backgroundColor: '#fff', paddingHorizontal: 12,
        paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        borderTopWidth: 1, borderTopColor: '#E8ECF0', ...Shadows.lg,
    },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'flex-end',
        backgroundColor: '#F5F7FA', borderRadius: 24,
        borderWidth: 1.5, borderColor: '#E2E8F0',
        paddingLeft: 16, paddingRight: 4, paddingVertical: 4, minHeight: 48,
    },
    textInput: { flex: 1, fontSize: 15, color: '#1E293B', maxHeight: 100, paddingVertical: Platform.OS === 'ios' ? 10 : 8 },
    sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary[600], justifyContent: 'center', alignItems: 'center' },
    sendButtonDisabled: { backgroundColor: Colors.primary[200] },
    poweredBy: { fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 6 },

    // Language Dropdown
    dropdownBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 80, paddingRight: 12 },
    dropdownCard: {
        backgroundColor: '#fff', borderRadius: 16, width: 270,
        paddingVertical: 8, ...Shadows.lg,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    dropdownTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    dropdownOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    dropdownOptionActive: { backgroundColor: `${Colors.primary[600]}10` },
    dropdownFlag: { fontSize: 24 },
    dropdownText: { flex: 1 },
    dropdownLabel: { fontSize: 15, fontWeight: '600', color: '#334155' },
    dropdownLabelActive: { color: Colors.primary[600] },
    dropdownDesc: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
});
