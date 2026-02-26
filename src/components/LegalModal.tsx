import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Linking,
} from 'react-native';
import { COLORS } from '../constants/mockData';
import { useTheme } from '../constants/theme';

const APP_NAME = 'DineFinder';
const DEVELOPER = 'the developer of DineFinder';
const CONTACT_EMAIL = 'ryoma.s0729@gmail.com';
const LAST_UPDATED = 'February 2026';

const TERMS_SECTIONS = [
  {
    heading: '1. Acceptance of Terms',
    text: `By downloading, installing, or using ${APP_NAME}, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.`,
  },
  {
    heading: '2. Description of Service',
    text: `${APP_NAME} is a restaurant discovery app that allows users to browse, filter, and save nearby restaurants using a swipe-based interface. The app uses your device location to show relevant results. Restaurant data, including photos, reviews, and business details, is sourced from the Google Places API.`,
  },
  {
    heading: '3. User Accounts',
    text: `You may create an account using email and password, Google Sign-In, or Apple Sign-In. Account data is managed through Google Firebase Authentication. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.`,
  },
  {
    heading: '4. Groups Feature',
    text: `${APP_NAME} allows users to create or join groups using invite codes. Within a group, your restaurant swipe choices are shared with other group members to find matching restaurants. By joining a group, you consent to sharing your swipe data with the other members of that group.`,
  },
  {
    heading: '5. Acceptable Use',
    text: `You agree not to: (a) use the service for any unlawful purpose; (b) attempt to gain unauthorised access to any part of the service; (c) interfere with or disrupt the service; (d) reproduce or distribute any part of the service without permission.`,
  },
  {
    heading: '6. Restaurant Information',
    text: `Restaurant data (hours, prices, ratings, reviews, photos) is provided by the Google Places API and may not always be accurate or up to date. ${APP_NAME} does not verify this information. Please confirm details directly with the restaurant before visiting.`,
  },
  {
    heading: '7. Google Terms',
    text: `${APP_NAME} uses Google Maps and Google Places services. By using this app, you also agree to Google's Terms of Service and Privacy Policy.`,
    links: [
      { label: 'Google Terms of Service', url: 'https://policies.google.com/terms' },
      { label: 'Google Privacy Policy', url: 'https://policies.google.com/privacy' },
    ],
  },
  {
    heading: '8. Disclaimer of Warranties',
    text: `${APP_NAME} is provided "as is" without warranty of any kind. We do not guarantee the accuracy, completeness, or timeliness of any restaurant information displayed in the app.`,
  },
  {
    heading: '9. Limitation of Liability',
    text: `To the fullest extent permitted by law, ${DEVELOPER} shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app or any restaurant visited based on app information.`,
  },
  {
    heading: '10. Changes to Terms',
    text: 'These Terms may be updated from time to time. Continued use of the app after changes constitutes acceptance of the updated Terms.',
  },
  {
    heading: '11. Contact',
    text: `For questions about these Terms, contact us at ${CONTACT_EMAIL}.`,
  },
];

const PRIVACY_SECTIONS = [
  {
    heading: '1. Information We Collect',
    text: `We collect the following information:\n\n• Account information — When you sign up, we collect your email address, display name, and profile photo via Firebase Authentication (email/password, Google Sign-In, or Apple Sign-In).\n\n• Location data — Your device location is used to find nearby restaurants. Location is only accessed while the app is in use and is not stored on our servers.\n\n• Saved restaurants and preferences — Your swipe choices, saved restaurants, and filter settings are stored both locally on your device and in Google Firebase Firestore for cloud sync.\n\n• Group data — If you create or join a group, your group membership and restaurant swipe choices within that group are stored in Firebase Firestore and shared with other group members.`,
  },
  {
    heading: '2. How We Use Your Information',
    text: `• Your location is sent to the Google Places API to fetch nearby restaurant results.\n\n• Your account information is used to identify you within the app and in groups.\n\n• Your saved restaurants and preferences are synced via Firebase Firestore so they persist across devices and sessions.\n\n• Group swipe data is used to calculate restaurant matches between group members.`,
  },
  {
    heading: '3. Data Storage',
    text: `Your data is stored in two places:\n\n• Locally on your device — Using AsyncStorage for offline access and caching.\n\n• Google Firebase — Account data (Firebase Authentication), saved restaurants, user preferences, and group data are stored in Firebase Firestore. Firebase servers are managed by Google and are subject to Google's security practices.`,
  },
  {
    heading: '4. Third-Party Services',
    text: `${APP_NAME} uses the following third-party services:\n\n• Google Firebase — Authentication, data storage (Firestore).\n• Google Places API — Restaurant data, photos, and reviews.\n• Apple Sign-In — Authentication (iOS).\n\nBy using this app, you also agree to the terms and privacy policies of these services.`,
    links: [
      { label: 'Google Terms of Service', url: 'https://policies.google.com/terms' },
      { label: 'Google Privacy Policy', url: 'https://policies.google.com/privacy' },
    ],
  },
  {
    heading: '5. Location Data',
    text: 'Location access is requested only while the app is in use ("When In Use" permission). We do not track your location in the background. Your coordinates are sent to the Google Places API to fetch nearby restaurants and are not stored on our servers.',
  },
  {
    heading: '6. Data Sharing',
    text: `We do not sell or share your personal data with third parties for marketing purposes. Your data is only shared in the following cases:\n\n• With other members of groups you join (swipe choices only).\n• With Google services (Firebase, Places API) as necessary to provide the app's functionality.`,
  },
  {
    heading: '7. Data Deletion',
    text: `You can delete your saved restaurants and leave groups at any time within the app. You can also delete your account and all associated data from the Account screen (Account → Delete Account). Uninstalling the app will remove all locally stored data.`,
  },
  {
    heading: '8. Children\'s Privacy',
    text: `${APP_NAME} is not directed to children under 13. We do not knowingly collect personal information from children under 13.`,
  },
  {
    heading: '9. Changes to This Policy',
    text: 'We may update this Privacy Policy from time to time. Significant changes will be communicated through the app.',
  },
  {
    heading: '10. Contact Us',
    text: `If you have any questions about this Privacy Policy, please contact us at ${CONTACT_EMAIL}.`,
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export default function LegalModal({ visible, onClose, type }: Props) {
  const theme = useTheme();
  const isTerms = type === 'terms';
  const title = isTerms ? 'Terms of Service' : 'Privacy Policy';
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.divider }]}>
          <View style={styles.headerLeft} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.updated, { color: theme.subtext }]}>Last updated: {LAST_UPDATED}</Text>

          {sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>{section.heading}</Text>
              <Text style={[styles.sectionText, { color: theme.subtext }]}>{section.text}</Text>
              {'links' in section && section.links && (
                <View style={styles.linkList}>
                  {section.links.map((link: { label: string; url: string }) => (
                    <TouchableOpacity
                      key={link.url}
                      onPress={() => Linking.openURL(link.url)}
                    >
                      <Text style={styles.linkText}>{link.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          <View style={[styles.footer, { borderTopColor: theme.divider }]}>
            <Text style={[styles.footerText, { color: theme.subtext }]}>
              {APP_NAME}
            </Text>
            <Text style={[styles.footerText, { color: theme.subtext }]}>{CONTACT_EMAIL}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    width: 48,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    paddingHorizontal: 4,
  },
  closeText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
  },
  updated: {
    fontSize: 12,
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  linkList: {
    marginTop: 8,
    gap: 6,
  },
  linkText: {
    fontSize: 13,
    color: COLORS.maps,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
