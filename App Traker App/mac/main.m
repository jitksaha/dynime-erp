#import <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>
#import <Foundation/Foundation.h>

@interface AppDelegate : NSObject <NSApplicationDelegate, WKNavigationDelegate, WKScriptMessageHandler>
@property (strong, nonatomic) NSWindow *window;
@property (strong, nonatomic) WKWebView *webView;
@property (strong, nonatomic) NSStatusItem *statusItem;
@property (strong, nonatomic) NSTimer *heartbeatTimer;
@property (strong, nonatomic) NSTimer *screenshotTimer;
@property (assign, nonatomic) BOOL isClockedIn;
@property (assign, nonatomic) NSInteger elapsedSeconds;
@property (strong, nonatomic) NSString *apiToken;
@property (strong, nonatomic) NSString *apiBaseUrl;
@property (strong, nonatomic) NSString *userEmail;
@property (strong, nonatomic) NSString *userName;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)aNotification {
    self.apiBaseUrl = @"https://app.dynime.com";
    self.isClockedIn = NO;
    self.elapsedSeconds = 0;
    
    [self loadSavedConfig];

    // 1. Create Main Native Window (Full Window Fit)
    NSRect frame = NSMakeRect(0, 0, 1050, 750);
    NSUInteger styleMask = NSWindowStyleMaskTitled | NSWindowStyleMaskClosable | NSWindowStyleMaskResizable | NSWindowStyleMaskMiniaturizable;
    self.window = [[NSWindow alloc] initWithContentRect:frame styleMask:styleMask backing:NSBackingStoreBuffered defer:NO];
    [self.window setTitle:@"Dtime Trace"];
    [self.window setBackgroundColor:[NSColor colorWithCalibratedRed:0.97 green:0.98 blue:0.99 alpha:1.0]];
    [self.window center];

    // 2. Configure WKWebView with JS Bridge
    WKUserContentController *userContentController = [[WKUserContentController alloc] init];
    [userContentController addScriptMessageHandler:self name:@"dynimeTracker"];

    WKWebViewConfiguration *config = [[WKWebViewConfiguration alloc] init];
    config.userContentController = userContentController;

    self.webView = [[WKWebView alloc] initWithFrame:self.window.contentView.bounds configuration:config];
    self.webView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    self.webView.navigationDelegate = self;
    [self.webView setValue:@NO forKey:@"drawsBackground"];
    [self.window.contentView addSubview:self.webView];

    // 3. Load Embedded HTML/JS App UI
    NSString *htmlContent = [self buildAppHtmlUI];
    [self.webView loadHTMLString:htmlContent baseURL:[NSURL URLWithString:self.apiBaseUrl]];
    [self.window makeKeyAndOrderFront:nil];
    [NSApp activateIgnoringOtherApps:YES];

    // 4. Setup Status Bar Menu Item (System Tray)
    [self setupStatusItem];

    // 5. Start Background Native Heartbeat Timer (15s auto-sync interval)
    self.heartbeatTimer = [NSTimer scheduledTimerWithTimeInterval:15.0 target:self selector:@selector(onHeartbeatTimer:) userInfo:nil repeats:YES];

    // 6. Schedule Random Screenshot Capture
    [self scheduleRandomScreenshot];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
    return NO;
}

- (BOOL)applicationShouldHandleReopen:(NSApplication *)sender hasVisibleWindows:(BOOL)flag {
    if (!flag) {
        [self.window makeKeyAndOrderFront:nil];
    }
    return YES;
}

#pragma mark - WKScriptMessageHandler

- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {
    if (![message.name isEqualToString:@"dynimeTracker"]) return;
    
    NSDictionary *body = message.body;
    NSString *action = body[@"action"];
    NSDictionary *payload = body[@"payload"];

    if ([action isEqualToString:@"saveAuth"]) {
        self.apiToken = payload[@"token"];
        self.userEmail = payload[@"email"];
        self.userName = payload[@"name"];
        if (payload[@"baseUrl"] && [payload[@"baseUrl"] length] > 0) {
            self.apiBaseUrl = payload[@"baseUrl"];
        }
        [self saveConfigToFile];
    } 
    else if ([action isEqualToString:@"clearAuth"]) {
        self.apiToken = nil;
        self.isClockedIn = NO;
        self.elapsedSeconds = 0;
        [self removeConfigFile];
        [self updateStatusItemTitle];
    }
    else if ([action isEqualToString:@"updateStatus"]) {
        self.isClockedIn = [payload[@"isClockedIn"] boolValue];
        self.elapsedSeconds = [payload[@"elapsedSeconds"] integerValue];
        [self updateStatusItemTitle];
        
        if (self.isClockedIn) {
            [self scheduleRandomScreenshot];
        }
    }
    else if ([action isEqualToString:@"triggerScreenshot"]) {
        [self captureAndUploadScreenshot];
    }
    else if ([action isEqualToString:@"notify"]) {
        NSString *title = payload[@"title"] ?: @"Dtime Trace";
        NSString *msg = payload[@"message"] ?: @"Notification from Dtime Trace";
        [self sendNotificationWithTitle:title message:msg];
    }
}

#pragma mark - System Tray & Status Bar

- (void)setupStatusItem {
    self.statusItem = [[NSStatusBar systemStatusBar] statusItemWithLength:NSVariableStatusItemLength];
    [self updateStatusItemTitle];
    [self rebuildStatusMenu];
}

- (void)rebuildStatusMenu {
    NSMenu *menu = [[NSMenu alloc] init];
    
    NSMenuItem *headerItem = [[NSMenuItem alloc] initWithTitle:@"Dtime Trace" action:nil keyEquivalent:@""];
    [headerItem setEnabled:NO];
    [menu addItem:headerItem];
    [menu addItem:[NSMenuItem separatorItem]];

    NSMenuItem *showItem = [[NSMenuItem alloc] initWithTitle:@"Open Dtime Trace Window" action:@selector(onOpenDashboard:) keyEquivalent:@"d"];
    [menu addItem:showItem];

    NSString *toggleTitle = self.isClockedIn ? @"Stop Clock-Out" : @"Start Clock-In";
    NSMenuItem *toggleItem = [[NSMenuItem alloc] initWithTitle:toggleTitle action:@selector(onMenuToggleClock:) keyEquivalent:@"t"];
    [menu addItem:toggleItem];

    [menu addItem:[NSMenuItem separatorItem]];
    NSMenuItem *quitItem = [[NSMenuItem alloc] initWithTitle:@"Quit Dtime Trace" action:@selector(onQuit:) keyEquivalent:@"q"];
    [menu addItem:quitItem];

    self.statusItem.menu = menu;
}

- (void)updateStatusItemTitle {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (self.isClockedIn) {
            NSInteger hrs = self.elapsedSeconds / 3600;
            NSInteger mins = (self.elapsedSeconds % 3600) / 60;
            NSInteger secs = self.elapsedSeconds % 60;
            self.statusItem.button.title = [NSString stringWithFormat:@"Dtime Trace: %02ld:%02ld:%02ld", (long)hrs, (long)mins, (long)secs];
        } else {
            self.statusItem.button.title = @"Dtime Trace: Idle";
        }
        [self rebuildStatusMenu];
    });
}

- (void)onOpenDashboard:(id)sender {
    [self.window makeKeyAndOrderFront:nil];
    [NSApp activateIgnoringOtherApps:YES];
}

- (void)onMenuToggleClock:(id)sender {
    [self.webView evaluateJavaScript:@"window.toggleClockFromNative();" completionHandler:nil];
}

#pragma mark - Heartbeat & Random Screenshots

- (void)onHeartbeatTimer:(NSTimer *)timer {
    if (self.isClockedIn) {
        self.elapsedSeconds += 15;
        [self updateStatusItemTitle];
    }
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.webView evaluateJavaScript:@"window.nativeHeartbeatTick();" completionHandler:nil];
    });
}

- (void)scheduleRandomScreenshot {
    if (self.screenshotTimer) {
        [self.screenshotTimer invalidate];
        self.screenshotTimer = nil;
    }
    if (!self.isClockedIn) return;

    NSInteger randomInterval = 300 + arc4random_uniform(420);
    self.screenshotTimer = [NSTimer scheduledTimerWithTimeInterval:randomInterval target:self selector:@selector(onTakeRandomScreenshot:) userInfo:nil repeats:NO];
}

- (void)onTakeRandomScreenshot:(NSTimer *)timer {
    if (self.isClockedIn && self.apiToken && self.apiToken.length > 0) {
        [self captureAndUploadScreenshot];
    }
    [self scheduleRandomScreenshot];
}

- (void)captureAndUploadScreenshot {
    if (!self.apiToken || self.apiToken.length == 0) return;

    NSString *tmpPath = [NSString stringWithFormat:@"/tmp/dynime_snap_%ld.jpg", (long)[[NSDate date] timeIntervalSince1970]];
    NSTask *task = [[NSTask alloc] init];
    [task setLaunchPath:@"/usr/sbin/screencapture"];
    [task setArguments:@[@"-x", tmpPath]];
    
    @try {
        [task launch];
        [task waitUntilExit];

        if ([[NSFileManager defaultManager] fileExistsAtPath:tmpPath]) {
            NSData *imgData = [NSData dataWithContentsOfFile:tmpPath];
            [self uploadScreenshotData:imgData];
            [[NSFileManager defaultManager] removeItemAtPath:tmpPath error:nil];
        }
    } @catch (NSException *exception) {
        NSLog(@"Screenshot capture failed: %@", exception.reason);
    }
}

- (void)uploadScreenshotData:(NSData *)imageData {
    if (!imageData || !self.apiToken) return;

    NSString *boundary = @"Boundary-Dynime-Tracker-Snap";
    NSString *endpoint = [NSString stringWithFormat:@"%@/api/time-tracker/upload-screenshot", self.apiBaseUrl];
    NSMutableURLRequest *req = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:endpoint]];
    [req setHTTPMethod:@"POST"];
    [req setValue:[NSString stringWithFormat:@"multipart/form-data; boundary=%@", boundary] forHTTPHeaderField:@"Content-Type"];
    [req setValue:[NSString stringWithFormat:@"Bearer %@", self.apiToken] forHTTPHeaderField:@"Authorization"];

    NSMutableData *body = [NSMutableData data];
    [body appendData:[[NSString stringWithFormat:@"--%@\r\n", boundary] dataUsingEncoding:NSUTF8StringEncoding]];
    [body appendData:[@"Content-Disposition: form-data; name=\"active_window\"\r\n\r\nmacOS Desktop Workspace\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
    [body appendData:[[NSString stringWithFormat:@"--%@\r\n", boundary] dataUsingEncoding:NSUTF8StringEncoding]];
    [body appendData:[@"Content-Disposition: form-data; name=\"screenshot\"; filename=\"screenshot.jpg\"\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
    [body appendData:[@"Content-Type: image/jpeg\r\n\r\n" dataUsingEncoding:NSUTF8StringEncoding]];
    [body appendData:imageData];
    [body appendData:[[NSString stringWithFormat:@"\r\n--%@--\r\n", boundary] dataUsingEncoding:NSUTF8StringEncoding]];
    [req setHTTPBody:body];

    NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:req completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        if (!error && data) {
            dispatch_async(dispatch_get_main_queue(), ^{
                [self.webView evaluateJavaScript:@"window.onScreenshotUploadedSuccess();" completionHandler:nil];
            });
        }
    }];
    [task resume];
}

#pragma mark - Persistence Config

- (NSString *)configFilePath {
    return [NSHomeDirectory() stringByAppendingPathComponent:@".dynime_tracker_config.json"];
}

- (void)saveConfigToFile {
    NSDictionary *dict = @{
        @"token": self.apiToken ?: @"",
        @"baseUrl": self.apiBaseUrl ?: @"https://app.dynime.com",
        @"email": self.userEmail ?: @"",
        @"name": self.userName ?: @""
    };
    NSData *data = [NSJSONSerialization dataWithJSONObject:dict options:NSJSONWritingPrettyPrinted error:nil];
    [data writeToFile:[self configFilePath] atomically:YES];
}

- (void)loadSavedConfig {
    NSString *path = [self configFilePath];
    if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
        NSData *data = [NSData dataWithContentsOfFile:path];
        if (data) {
            NSDictionary *dict = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
            if (dict) {
                self.apiToken = dict[@"token"];
                if (dict[@"baseUrl"] && [dict[@"baseUrl"] length] > 0) {
                    self.apiBaseUrl = dict[@"baseUrl"];
                }
                self.userEmail = dict[@"email"];
                self.userName = dict[@"name"];
            }
        }
    }
}

- (void)removeConfigFile {
    [[NSFileManager defaultManager] removeItemAtPath:[self configFilePath] error:nil];
}

#pragma mark - User Notifications

- (void)sendNotificationWithTitle:(NSString *)title message:(NSString *)message {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    NSUserNotification *notification = [[NSUserNotification alloc] init];
    notification.title = title;
    notification.informativeText = message;
    [[NSUserNotificationCenter defaultUserNotificationCenter] deliverNotification:notification];
#pragma clang diagnostic pop
}

- (void)onQuit:(id)sender {
    [NSApp terminate:nil];
}

#pragma mark - Embedded Web Application HTML String

- (NSString *)buildAppHtmlUI {
    NSString *savedTokenEscaped = self.apiToken ? self.apiToken : @"";
    NSString *savedBaseUrlEscaped = self.apiBaseUrl ? self.apiBaseUrl : @"https://app.dynime.com";

    return [NSString stringWithFormat:
    @"<!DOCTYPE html>\n"
    "<html>\n"
    "<head>\n"
    "  <meta charset=\"UTF-8\">\n"
    "  <title>Dtime Trace</title>\n"
    "  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n"
    "  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n"
    "  <link href=\"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n"
    "  <style>\n"
    "    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-user-select: none; }\n"
    "    body { background: #f8fafc; color: #0f172a; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }\n"
    "    .titlebar { height: 48px; background: #ffffff; -webkit-app-region: drag; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; border-bottom: 1px solid #e2e8f0; shadow: 0 1px 3px rgba(0,0,0,0.02); }\n"
    "    .titlebar-brand { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; }\n"
    "    .titlebar-brand img { width: 22px; height: 22px; object-fit: contain; }\n"
    "    .app-viewport { flex: 1; display: flex; flex-direction: column; width: 100%%; height: calc(100vh - 48px); background: #f8fafc; overflow-y: auto; }\n"
    "    .fullscreen-pane { flex: 1; display: flex; flex-direction: column; width: 100%%; min-height: 100%%; padding: 32px 40px; box-sizing: border-box; justify-content: center; }\n"
    "    .white-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); position: relative; width: 100%%; box-sizing: border-box; }\n"
    "    .form-group { margin-bottom: 20px; text-align: left; }\n"
    "    .form-label { display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em; }\n"
    "    .form-input { width: 100%%; padding: 14px 16px; border-radius: 12px; background: #f8fafc; border: 1.5px solid #e2e8f0; color: #0f172a; font-size: 14px; outline: none; transition: all 0.2s; font-weight: 500; }\n"
    "    .form-input:focus { border-color: #6366f1; background: #ffffff; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12); }\n"
    "    .btn-primary { width: 100%%; padding: 16px; border-radius: 14px; background: #4f46e5; color: #ffffff; font-size: 15px; font-weight: 800; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 24px rgba(79, 70, 229, 0.25); display: flex; align-items: center; justify-content: center; gap: 8px; }\n"
    "    .btn-primary:hover { background: #4338ca; transform: translateY(-1px); }\n"
    "    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }\n"
    "    .status-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 999px; font-size: 13px; font-weight: 800; border: 1px solid #e2e8f0; }\n"
    "    .status-badge.active { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }\n"
    "    .status-badge.idle { background: #fff1f2; color: #e11d48; border-color: #fecdd3; }\n"
    "    .dot-emerald { width: 10px; height: 10px; border-radius: 50%%; background: #10b981; box-shadow: 0 0 12px #10b981; animation: pulse 1.5s infinite; }\n"
    "    .dot-rose { width: 10px; height: 10px; border-radius: 50%%; background: #f43f5e; }\n"
    "    @keyframes pulse { 0%% { opacity: 0.5; transform: scale(0.9); } 50%% { opacity: 1; transform: scale(1.25); } 100%% { opacity: 0.5; transform: scale(0.9); } }\n"
    "    .timer-text { font-size: 76px; font-weight: 800; letter-spacing: -0.04em; text-align: center; margin: 24px 0 20px; font-variant-numeric: tabular-nums; color: #0f172a; text-shadow: 0 2px 10px rgba(0,0,0,0.03); }\n"
    "    .btn-clock-main { width: 100%%; max-width: 420px; margin: 0 auto; padding: 20px 32px; border-radius: 18px; font-size: 18px; font-weight: 800; border: none; cursor: pointer; transition: all 0.25s; display: flex; align-items: center; justify-content: center; gap: 12px; }\n"
    "    .btn-clock-main:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }\n"
    "    .btn-clock-in { background: #10b981; color: #ffffff; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3); }\n"
    "    .btn-clock-in:hover:not(:disabled) { background: #059669; transform: translateY(-2px); box-shadow: 0 14px 36px rgba(16, 185, 129, 0.4); }\n"
    "    .btn-clock-out { background: #f43f5e; color: #ffffff; box-shadow: 0 10px 30px rgba(244, 63, 94, 0.3); }\n"
    "    .btn-clock-out:hover:not(:disabled) { background: #e11d48; transform: translateY(-2px); box-shadow: 0 14px 36px rgba(244, 63, 94, 0.4); }\n"
    "    .metrics-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 32px; }\n"
    "    .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; text-align: center; }\n"
    "    .metric-num { font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 6px; }\n"
    "    .metric-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }\n"
    "    .user-profile-bar { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 28px; }\n"
    "    .user-profile-left { display: flex; align-items: center; gap: 16px; }\n"
    "    .avatar-circle { width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, #4f46e5, #7c3aed); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: #ffffff; shadow: 0 4px 14px rgba(79, 70, 229, 0.3); }\n"
    "    .user-details h4 { font-size: 17px; font-weight: 800; color: #0f172a; text-align: left; }\n"
    "    .user-details p { font-size: 13px; color: #64748b; font-weight: 600; text-align: left; margin-top: 2px; }\n"
    "    .btn-logout-clean { padding: 10px 18px; border-radius: 12px; background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }\n"
    "    .btn-logout-clean:hover { background: #e2e8f0; color: #0f172a; }\n"
    "    .alert-banner { padding: 14px 18px; border-radius: 12px; background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; font-size: 13px; font-weight: 700; margin-bottom: 20px; display: none; text-align: left; }\n"
    "    .icon-svg { width: 18px; height: 18px; vertical-align: middle; flex-shrink: 0; }\n"
    "  </style>\n"
    "</head>\n"
    "<body>\n"
    "  <div class=\"titlebar\">\n"
    "    <div class=\"titlebar-brand\">\n"
    "      <img src=\"https://cdn.dynime.com/Dynime%%20Logo/Favicon/dynime-favicon.png\" alt=\"Logo\" />\n"
    "      <span>Dtime Trace Client v4.0 <span style=\"font-weight:600; color:#6366f1; margin-left:6px;\">(Beta Phase &bull; Live Very Soon)</span></span>\n"
    "    </div>\n"
    "    <div style=\"font-size:11px; font-weight:700; color:#10b981; display:flex; align-items:center; gap:6px;\">\n"
    "      <span style=\"width:7px; height:7px; border-radius:50%%; background:#10b981; display:inline-block;\"></span>\n"
    "      <span>Auto-Sync Active</span>\n"
    "    </div>\n"
    "  </div>\n"
    "\n"
    "  <div class=\"app-viewport\">\n"
    "    <!-- LOGIN VIEW -->\n"
    "    <div id=\"loginView\" class=\"fullscreen-pane\" style=\"max-width: 480px; margin: 0 auto;\">\n"
    "      <div class=\"white-card\">\n"
    "        <div style=\"text-align:center; margin-bottom: 24px;\">\n"
    "          <img src=\"https://cdn.dynime.com/Dynime%%20Logo/Favicon/dynime-favicon.png\" style=\"width:54px; height:54px; object-fit:contain; margin-bottom:12px;\" alt=\"Logo\" />\n"
    "          <h2 style=\"font-size: 24px; font-weight: 800; color: #0f172a;\">Dtime Trace</h2>\n"
    "          <p style=\"font-size: 13px; color: #64748b; font-weight: 600; margin-top: 4px;\">Automated Time Tracking &bull; <span style=\"color:#4f46e5; font-weight:800;\">Beta Phase &bull; Live Very Soon</span></p>\n"
    "        </div>\n"
    "        \n"
    "        <div id=\"loginAlert\" class=\"alert-banner\"></div>\n"
    "        \n"
    "        <div style=\"display: flex; gap: 8px; margin-bottom: 20px;\">\n"
    "          <button id=\"tabCreds\" type=\"button\" onclick=\"switchLoginTab('creds')\" style=\"flex: 1; padding: 10px; border-radius: 10px; background: #4f46e5; border: none; color: #ffffff; font-size: 12px; font-weight: 800; cursor: pointer;\">ERP Account Login</button>\n"
    "          <button id=\"tabToken\" type=\"button\" onclick=\"switchLoginTab('token')\" style=\"flex: 1; padding: 10px; border-radius: 10px; background: #f1f5f9; border: 1px solid #cbd5e1; color: #64748b; font-size: 12px; font-weight: 800; cursor: pointer;\">App Pairing Key</button>\n"
    "        </div>\n"
    "\n"
    "        <form id=\"formCreds\" onsubmit=\"handleLoginSubmit(event)\">\n"
    "          <div class=\"form-group\">\n"
    "            <label class=\"form-label\">ERP Server Domain</label>\n"
    "            <input type=\"text\" id=\"inputBaseUrl\" class=\"form-input\" value=\"%@\" placeholder=\"https://app.dynime.com\" required />\n"
    "          </div>\n"
    "          <div class=\"form-group\">\n"
    "            <label class=\"form-label\">Email Address</label>\n"
    "            <input type=\"email\" id=\"inputEmail\" class=\"form-input\" placeholder=\"you@company.com\" required />\n"
    "          </div>\n"
    "          <div class=\"form-group\">\n"
    "            <label class=\"form-label\">Password</label>\n"
    "            <input type=\"password\" id=\"inputPassword\" class=\"form-input\" placeholder=\"••••••••\" required />\n"
    "          </div>\n"
    "          <button type=\"submit\" id=\"btnLogin\" class=\"btn-primary\">\n"
    "            <span>Sign In to Dtime Trace</span>\n"
    "          </button>\n"
    "        </form>\n"
    "\n"
    "        <form id=\"formToken\" onsubmit=\"handleTokenSubmit(event)\" style=\"display: none;\">\n"
    "          <div class=\"form-group\">\n"
    "            <label class=\"form-label\">ERP Server Domain</label>\n"
    "            <input type=\"text\" id=\"inputTokenBaseUrl\" class=\"form-input\" value=\"%@\" placeholder=\"https://app.dynime.com\" required />\n"
    "          </div>\n"
    "          <div class=\"form-group\">\n"
    "            <label class=\"form-label\">App Pairing Token Key</label>\n"
    "            <input type=\"text\" id=\"inputPairingKey\" class=\"form-input\" placeholder=\"Paste pairing token key from ERP portal\" required />\n"
    "          </div>\n"
    "          <button type=\"submit\" id=\"btnTokenLogin\" class=\"btn-primary\">\n"
    "            <span>Connect with Pairing Key</span>\n"
    "          </button>\n"
    "        </form>\n"
    "      </div>\n"
    "    </div>\n"
    "\n"
    "    <!-- MAIN FULL-SCREEN DASHBOARD VIEW -->\n"
    "    <div id=\"dashView\" class=\"fullscreen-pane\" style=\"display: none;\">\n"
    "      <div class=\"white-card\">\n"
    "        <div class=\"user-profile-bar\">\n"
    "          <div class=\"user-profile-left\">\n"
    "            <div id=\"userAvatar\" class=\"avatar-circle\">U</div>\n"
    "            <div class=\"user-details\">\n"
    "              <h4 id=\"userNameText\">Employee Name</h4>\n"
    "              <p id=\"userDesignationText\">Staff Member &bull; Dynime ERP</p>\n"
    "            </div>\n"
    "          </div>\n"
    "          <button onclick=\"handleLogout()\" class=\"btn-logout-clean\">\n"
    "            <svg class=\"icon-svg\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1\"></path></svg>\n"
    "            <span>Logout</span>\n"
    "          </button>\n"
    "        </div>\n"
    "\n"
    "        <div style=\"text-align: center;\">\n"
    "          <div id=\"statusPill\" class=\"status-badge idle\">\n"
    "            <span id=\"statusDot\" class=\"dot-rose\"></span>\n"
    "            <span id=\"statusPillText\">Clocked Out &bull; Idle</span>\n"
    "          </div>\n"
    "\n"
    "          <div id=\"timerDisplay\" class=\"timer-text\">00:00:00</div>\n"
    "\n"
    "          <button id=\"btnClockToggle\" onclick=\"toggleClockState()\" class=\"btn-clock-main btn-clock-in\">\n"
    "            <span id=\"btnClockIcon\" style=\"display:flex; align-items:center;\">\n"
    "              <svg class=\"w-6 h-6 fill-current\" style=\"width:24px;height:24px;\" viewBox=\"0 0 24 24\"><path d=\"M8 5v14l11-7z\"/></svg>\n"
    "            </span>\n"
    "            <span id=\"btnClockText\">Clock In Now</span>\n"
    "          </button>\n"
    "\n"
    "          <div style=\"font-size: 12px; color: #64748b; margin-top: 18px; text-align: center; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;\">\n"
    "            <span style=\"display: inline-block; width: 7px; height: 7px; border-radius: 50%%; background: #10b981;\"></span>\n"
    "            <span>Automated real-time background sync active &bull; ERP Live Linked</span>\n"
    "          </div>\n"
    "        </div>\n"
    "\n"
    "        <div class=\"metrics-row\">\n"
    "          <div class=\"metric-card\">\n"
    "            <div class=\"metric-label\">Today Total</div>\n"
    "            <div id=\"statTotalHours\" class=\"metric-num\">0.00 hrs</div>\n"
    "          </div>\n"
    "          <div class=\"metric-card\">\n"
    "            <div class=\"metric-label\">Clocked In At</div>\n"
    "            <div id=\"statClockInTime\" class=\"metric-num\">--:--</div>\n"
    "          </div>\n"
    "        </div>\n"
    "      </div>\n"
    "    </div>\n"
    "  </div>\n"
    "\n"
    "  <script>\n"
    "    let state = {\n"
    "      token: localStorage.getItem('dtime_token') || '%@',\n"
    "      baseUrl: localStorage.getItem('dtime_base_url') || '%@',\n"
    "      isClockedIn: false,\n"
    "      elapsedSeconds: 0,\n"
    "      timerInterval: null,\n"
    "      user: null,\n"
    "      employee: null\n"
    "    };\n"
    "\n"
    "    function callNative(action, payload) {\n"
    "      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.dynimeTracker) {\n"
    "        window.webkit.messageHandlers.dynimeTracker.postMessage({ action: action, payload: payload });\n"
    "      }\n"
    "    }\n"
    "\n"
    "    function init() {\n"
    "      if (state.token && state.token.length > 5) {\n"
    "        showDashboardView();\n"
    "        fetchTrackerStatus();\n"
    "      } else {\n"
    "        showLoginView();\n"
    "      }\n"
    "    }\n"
    "\n"
    "    function switchLoginTab(tab) {\n"
    "      if (tab === 'creds') {\n"
    "        document.getElementById('formCreds').style.display = 'block';\n"
    "        document.getElementById('formToken').style.display = 'none';\n"
    "        document.getElementById('tabCreds').style.background = '#4f46e5';\n"
    "        document.getElementById('tabCreds').style.color = '#ffffff';\n"
    "        document.getElementById('tabToken').style.background = '#f1f5f9';\n"
    "        document.getElementById('tabToken').style.color = '#64748b';\n"
    "      } else {\n"
    "        document.getElementById('formCreds').style.display = 'none';\n"
    "        document.getElementById('formToken').style.display = 'block';\n"
    "        document.getElementById('tabToken').style.background = '#4f46e5';\n"
    "        document.getElementById('tabToken').style.color = '#ffffff';\n"
    "        document.getElementById('tabCreds').style.background = '#f1f5f9';\n"
    "        document.getElementById('tabCreds').style.color = '#64748b';\n"
    "      }\n"
    "    }\n"
    "\n"
    "    function showLoginAlert(msg) {\n"
    "      const el = document.getElementById('loginAlert');\n"
    "      el.innerText = msg;\n"
    "      el.style.display = 'block';\n"
    "    }\n"
    "    function hideLoginAlert() { document.getElementById('loginAlert').style.display = 'none'; }\n"
    "\n"
    "    async function handleLoginSubmit(e) {\n"
    "      e.preventDefault();\n"
    "      hideLoginAlert();\n"
    "      const btn = document.getElementById('btnLogin');\n"
    "      btn.innerText = 'Connecting...';\n"
    "      btn.disabled = true;\n"
    "\n"
    "      const baseUrl = document.getElementById('inputBaseUrl').value.trim().replace(/\\/$/, '');\n"
    "      const email = document.getElementById('inputEmail').value.trim();\n"
    "      const password = document.getElementById('inputPassword').value.trim();\n"
    "\n"
    "      try {\n"
    "        const res = await fetch(`${baseUrl}/api/login`, {\n"
    "          method: 'POST',\n"
    "          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },\n"
    "          body: JSON.stringify({ email: email, password: password, module: 'Hrm' })\n"
    "        });\n"
    "        const data = await res.json();\n"
    "        if (data.success && data.data && data.data.token) {\n"
    "          state.token = data.data.token;\n"
    "          state.baseUrl = baseUrl;\n"
    "          state.user = data.data.user;\n"
    "          localStorage.setItem('dtime_token', state.token);\n"
    "          localStorage.setItem('dtime_base_url', state.baseUrl);\n"
    "          callNative('saveAuth', { token: state.token, baseUrl: state.baseUrl, email: email, name: state.user.name });\n"
    "          callNative('notify', { title: 'Welcome to Dtime Trace', message: `Signed in as ${state.user.name}` });\n"
    "          showDashboardView();\n"
    "          fetchTrackerStatus();\n"
    "        } else {\n"
    "          showLoginAlert(data.message || 'Invalid email or password credentials.');\n"
    "        }\n"
    "      } catch (err) {\n"
    "        showLoginAlert('Unable to connect to ERP server. Check URL.');\n"
    "      } finally {\n"
    "        btn.innerText = 'Sign In to Dtime Trace';\n"
    "        btn.disabled = false;\n"
    "      }\n"
    "    }\n"
    "\n"
    "    async function handleTokenSubmit(e) {\n"
    "      e.preventDefault();\n"
    "      hideLoginAlert();\n"
    "      const baseUrl = document.getElementById('inputTokenBaseUrl').value.trim().replace(/\\/$/, '');\n"
    "      const key = document.getElementById('inputPairingKey').value.trim();\n"
    "      if (!key) return;\n"
    "      state.token = key;\n"
    "      state.baseUrl = baseUrl;\n"
    "      localStorage.setItem('dtime_token', key);\n"
    "      localStorage.setItem('dtime_base_url', baseUrl);\n"
    "      callNative('saveAuth', { token: key, baseUrl: baseUrl, email: 'pairing_key', name: 'Dtime Trace User' });\n"
    "      showDashboardView();\n"
    "      fetchTrackerStatus();\n"
    "    }\n"
    "\n"
    "    function showLoginView() {\n"
    "      document.getElementById('loginView').style.display = 'flex';\n"
    "      document.getElementById('dashView').style.display = 'none';\n"
    "    }\n"
    "\n"
    "    function showDashboardView() {\n"
    "      document.getElementById('loginView').style.display = 'none';\n"
    "      document.getElementById('dashView').style.display = 'flex';\n"
    "    }\n"
    "\n"
    "    async function fetchTrackerStatus() {\n"
    "      if (!state.token) {\n"
    "        handleLogout();\n"
    "        return;\n"
    "      }\n"
    "\n"
    "      try {\n"
    "        const res = await fetch(`${state.baseUrl}/api/time-tracker/status`, {\n"
    "          headers: { 'Authorization': `Bearer ${state.token}`, 'Accept': 'application/json' }\n"
    "        });\n"
    "        if (res.status === 401) {\n"
    "          handleLogout();\n"
    "          return;\n"
    "        }\n"
    "        const data = await res.json();\n"
    "        if (data.success && data.data) {\n"
    "          const d = data.data;\n"
    "          state.user = d.user;\n"
    "          state.employee = d.employee;\n"
    "          \n"
    "          if (d.user) {\n"
    "            document.getElementById('userNameText').innerText = d.user.name;\n"
    "            document.getElementById('userAvatar').innerText = d.user.name.charAt(0).toUpperCase();\n"
    "          }\n"
    "          if (d.employee) {\n"
    "            document.getElementById('userDesignationText').innerText = `${d.employee.designation || 'Staff Member'} • ID: ${d.employee.employee_id || '001'}`;\n"
    "          }\n"
    "          if (d.timer) {\n"
    "            document.getElementById('statTotalHours').innerText = `${d.timer.total_hours_today || '0.00'} hrs`;\n"
    "            document.getElementById('statClockInTime').innerText = d.timer.clock_in_time || '--:--';\n"
    "            setClockedInState(d.timer.is_clocked_in, Math.round((d.timer.total_hours_today || 0) * 3600));\n"
    "          }\n"
    "        } else if (!data.success && data.message && data.message.includes('Unauthenticated')) {\n"
    "          handleLogout();\n"
    "        }\n"
    "      } catch(err) {\n"
    "        console.error('Status fetch error:', err);\n"
    "      }\n"
    "    }\n"
    "\n"
    "    function setClockedInState(isClockedIn, totalSecs) {\n"
    "      state.isClockedIn = isClockedIn;\n"
    "      if (totalSecs !== undefined && totalSecs > state.elapsedSeconds) {\n"
    "        state.elapsedSeconds = totalSecs;\n"
    "      }\n"
    "      const pill = document.getElementById('statusPill');\n"
    "      const pillDot = document.getElementById('statusDot');\n"
    "      const pillTxt = document.getElementById('statusPillText');\n"
    "      const btn = document.getElementById('btnClockToggle');\n"
    "      const btnTxt = document.getElementById('btnClockText');\n"
    "      const btnIcon = document.getElementById('btnClockIcon');\n"
    "\n"
    "      if (isClockedIn) {\n"
    "        pill.className = 'status-badge active';\n"
    "        pillDot.className = 'dot-emerald';\n"
    "        pillTxt.innerText = 'Clocked In • Shift Active';\n"
    "        btn.className = 'btn-clock-main btn-clock-out';\n"
    "        btnTxt.innerText = 'Clock Out & Stop Shift';\n"
    "        btnIcon.innerHTML = '<svg class=\"w-6 h-6 fill-current\" style=\"width:24px;height:24px;\" viewBox=\"0 0 24 24\"><path d=\"M6 6h12v12H6z\"/></svg>';\n"
    "        startLocalTimer();\n"
    "      } else {\n"
    "        pill.className = 'status-badge idle';\n"
    "        pillDot.className = 'dot-rose';\n"
    "        pillTxt.innerText = 'Clocked Out • Idle';\n"
    "        btn.className = 'btn-clock-main btn-clock-in';\n"
    "        btnTxt.innerText = 'Clock In Now';\n"
    "        btnIcon.innerHTML = '<svg class=\"w-6 h-6 fill-current\" style=\"width:24px;height:24px;\" viewBox=\"0 0 24 24\"><path d=\"M8 5v14l11-7z\"/></svg>';\n"
    "        stopLocalTimer();\n"
    "      }\n"
    "      updateTimerDisplay();\n"
    "      callNative('updateStatus', { isClockedIn: isClockedIn, elapsedSeconds: state.elapsedSeconds });\n"
    "    }\n"
    "\n"
    "    function startLocalTimer() {\n"
    "      if (state.timerInterval) clearInterval(state.timerInterval);\n"
    "      state.timerInterval = setInterval(() => {\n"
    "        state.elapsedSeconds++;\n"
    "        updateTimerDisplay();\n"
    "      }, 1000);\n"
    "    }\n"
    "    function stopLocalTimer() {\n"
    "      if (state.timerInterval) clearInterval(state.timerInterval);\n"
    "    }\n"
    "\n"
    "    function updateTimerDisplay() {\n"
    "      const hrs = Math.floor(state.elapsedSeconds / 3600);\n"
    "      const mins = Math.floor((state.elapsedSeconds %% 3600) / 60);\n"
    "      const secs = state.elapsedSeconds %% 60;\n"
    "      const fmt = (n) => String(n).padStart(2, '0');\n"
    "      document.getElementById('timerDisplay').innerText = `${fmt(hrs)}:${fmt(mins)}:${fmt(secs)}`;\n"
    "    }\n"
    "\n"
    "    async function toggleClockState() {\n"
    "      if (!state.token) {\n"
    "        handleLogout();\n"
    "        return;\n"
    "      }\n"
    "      const btn = document.getElementById('btnClockToggle');\n"
    "      const btnTxt = document.getElementById('btnClockText');\n"
    "      btn.disabled = true;\n"
    "      btnTxt.innerText = 'Processing...';\n"
    "\n"
    "      const endpoint = state.isClockedIn ? `${state.baseUrl}/api/time-tracker/clock-out` : `${state.baseUrl}/api/time-tracker/clock-in`;\n"
    "      try {\n"
    "        const res = await fetch(endpoint, {\n"
    "          method: 'POST',\n"
    "          headers: {\n"
    "            'Content-Type': 'application/json',\n"
    "            'Authorization': `Bearer ${state.token}`,\n"
    "            'Accept': 'application/json'\n"
    "          },\n"
    "          body: JSON.stringify({ platform: 'mac' })\n"
    "        });\n"
    "        if (res.status === 401) {\n"
    "          handleLogout();\n"
    "          return;\n"
    "        }\n"
    "        const data = await res.json();\n"
    "        if (data.success) {\n"
    "          const newClockState = !state.isClockedIn;\n"
    "          setClockedInState(newClockState, state.elapsedSeconds);\n"
    "          callNative('notify', {\n"
    "            title: newClockState ? 'Dtime Trace: Clocked In' : 'Dtime Trace: Clocked Out',\n"
    "            message: newClockState ? 'Shift active & automated tracking running.' : 'Shift session saved to Dynime ERP.'\n"
    "          });\n"
    "          if (newClockState) {\n"
    "            callNative('triggerScreenshot', {});\n"
    "          }\n"
    "          fetchTrackerStatus();\n"
    "        } else {\n"
    "          alert(data.message || 'Clock action failed');\n"
    "          setClockedInState(state.isClockedIn, state.elapsedSeconds);\n"
    "        }\n"
    "      } catch(err) {\n"
    "        alert('Server connection error while toggling clock.');\n"
    "        setClockedInState(state.isClockedIn, state.elapsedSeconds);\n"
    "      } finally {\n"
    "        btn.disabled = false;\n"
    "      }\n"
    "    }\n"
    "\n"
    "    window.toggleClockFromNative = function() { toggleClockState(); };\n"
    "    window.fetchTrackerStatus = function() { fetchTrackerStatus(); };\n"
    "    window.nativeHeartbeatTick = function() {\n"
    "      if (state.isClockedIn && state.token) {\n"
    "        fetch(`${state.baseUrl}/api/time-tracker/sync-heartbeat`, {\n"
    "          method: 'POST',\n"
    "          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },\n"
    "          body: JSON.stringify({ elapsed_seconds: state.elapsedSeconds, platform: 'mac' })\n"
    "        }).catch(err => console.log(err));\n"
    "      }\n"
    "      fetchTrackerStatus();\n"
    "    };\n"
    "    window.onScreenshotUploadedSuccess = function() {};\n"
    "\n"
    "    function handleLogout() {\n"
    "      stopLocalTimer();\n"
    "      state.token = '';\n"
    "      state.isClockedIn = false;\n"
    "      state.elapsedSeconds = 0;\n"
    "      localStorage.removeItem('dtime_token');\n"
    "      callNative('clearAuth', {});\n"
    "      showLoginView();\n"
    "    }\n"
    "\n"
    "    document.addEventListener('DOMContentLoaded', init);\n"
    "  </script>\n"
    "</body>\n"
    "</html>", savedBaseUrlEscaped, savedBaseUrlEscaped, savedTokenEscaped, savedBaseUrlEscaped];
}

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        NSApplication *app = [NSApplication sharedApplication];
        [app setActivationPolicy:NSApplicationActivationPolicyRegular];
        AppDelegate *delegate = [[AppDelegate alloc] init];
        [app setDelegate:delegate];
        [app run];
    }
    return 0;
}
