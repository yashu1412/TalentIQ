import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
// Import platform specific implementations for initialization
import 'package:webview_flutter_android/webview_flutter_android.dart';

import '../../../app/env.dart';
import '../../../shared/theme/tiq_theme.dart';

class ClerkAuthPage extends StatefulWidget {
  const ClerkAuthPage({super.key});

  @override
  State<ClerkAuthPage> createState() => _ClerkAuthPageState();
}

class _ClerkAuthPageState extends State<ClerkAuthPage> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();

    _controller = WebViewController();

    _controller
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(TIQColors.bgPrimary)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() => _isLoading = true);
          },
          onPageFinished: (String url) async {
            setState(() => _isLoading = false);
            
            // If we land on a page that is NOT the sign-in/up page, 
            // it means the user might be authenticated.
            // We try to extract the session token using Clerk's JS SDK if available on the page.
            if (!url.contains('sign-in') && !url.contains('sign-up')) {
              _tryExtractToken();
            }
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('Web resource error: ${error.description}');
          },
          onNavigationRequest: (NavigationRequest request) {
            // Prevent navigating away from the auth flow unless it's to our app
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(AppEnv.clerkSignInUrl));

    // Platform specific debugging/settings
    if (!kIsWeb) {
      if (_controller.platform is AndroidWebViewController) {
        AndroidWebViewController.enableDebugging(true);
        (_controller.platform as AndroidWebViewController)
            .setMediaPlaybackRequiresUserGesture(false);
      }
    }
  }

  Future<void> _tryExtractToken() async {
    try {
      // We attempt to call Clerk's session getToken via JS.
      // Note: This requires the page we are on to have the Clerk JS SDK loaded (your web app).
      final String? token = await _controller.runJavaScriptReturningResult('''
        (function() {
          try {
            if (window.Clerk && window.Clerk.session) {
              return window.Clerk.session.getToken();
            }
            // Fallback: check session storage or cookies if you have a custom success page
            return null;
          } catch (e) {
            return null;
          }
        })()
      ''') as String?;

      if (token != null && token != 'null' && token.isNotEmpty) {
        // Clean up quotes from result
        final cleanToken = token.replaceAll('"', '');
        if (mounted) {
          Navigator.pop(context, cleanToken);
        }
      }
    } catch (e) {
      debugPrint('Token extraction failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Login with Clerk'),
        backgroundColor: TIQColors.bgCard,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(color: TIQColors.primary),
            ),
        ],
      ),
    );
  }
}
