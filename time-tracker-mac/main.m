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

    // 1. Create Main Native Window
    NSRect frame = NSMakeRect(0, 0, 1100, 750);
    NSUInteger styleMask = NSWindowStyleMaskTitled | NSWindowStyleMaskClosable | NSWindowStyleMaskResizable | NSWindowStyleMaskMiniaturizable | NSWindowStyleMaskFullSizeContentView;
    self.window = [[NSWindow alloc] initWithContentRect:frame styleMask:styleMask backing:NSBackingStoreBuffered defer:NO];
    [self.window setTitle:@"Dynime ERP Time Tracker"];
    self.window.titlebarAppearsTransparent = YES;
    self.window.titleVisibility = NSWindowTitleHidden;
    [self.window setBackgroundColor:[NSColor colorWithCalibratedRed:0.05 green:0.07 blue:0.11 alpha:1.0]];
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

    // 5. Start Background Native Heartbeat Timer (30s interval)
    self.heartbeatTimer = [NSTimer scheduledTimerWithTimeInterval:30.0 target:self selector:@selector(onHeartbeatTimer:) userInfo:nil repeats:YES];

    // 6. Schedule Random Screenshot Capture
    [self scheduleRandomScreenshot];
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
        NSString *title = payload[@"title"] ?: @"Dynime Time Tracker";
        NSString *msg = payload[@"message"] ?: @"Notification from Dynime";
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
    
    NSMenuItem *headerItem = [[NSMenuItem alloc] initWithTitle:@"Dynime ERP Time Tracker" action:nil keyEquivalent:@""];
    [headerItem setEnabled:NO];
    [menu addItem:headerItem];
    [menu addItem:[NSMenuItem separatorItem]];

    NSMenuItem *showItem = [[NSMenuItem alloc] initWithTitle:@"Open Tracker Window" action:@selector(onOpenDashboard:) keyEquivalent:@"d"];
    [menu addItem:showItem];

    NSString *toggleTitle = self.isClockedIn ? @"Stop Clock-Out" : @"Start Clock-In";
    NSMenuItem *toggleItem = [[NSMenuItem alloc] initWithTitle:toggleTitle action:@selector(onMenuToggleClock:) keyEquivalent:@"t"];
    [menu addItem:toggleItem];

    NSMenuItem *syncItem = [[NSMenuItem alloc] initWithTitle:@"Sync Status Now" action:@selector(onMenuSyncNow:) keyEquivalent:@"s"];
    [menu addItem:syncItem];

    [menu addItem:[NSMenuItem separatorItem]];
    NSMenuItem *quitItem = [[NSMenuItem alloc] initWithTitle:@"Quit Tracker" action:@selector(onQuit:) keyEquivalent:@"q"];
    [menu addItem:quitItem];

    self.statusItem.menu = menu;
}

- (void)updateStatusItemTitle {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (self.isClockedIn) {
            NSInteger hrs = self.elapsedSeconds / 3600;
            NSInteger mins = (self.elapsedSeconds % 3600) / 60;
            NSInteger secs = self.elapsedSeconds % 60;
            self.statusItem.button.title = [NSString stringWithFormat:@"🟢 Dynime: %02ld:%02ld:%02ld", (long)hrs, (long)mins, (long)secs];
        } else {
            self.statusItem.button.title = @"🔴 Dynime: Idle";
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

- (void)onMenuSyncNow:(id)sender {
    [self.webView evaluateJavaScript:@"window.fetchTrackerStatus();" completionHandler:nil];
}

#pragma mark - Heartbeat & Random Screenshots

- (void)onHeartbeatTimer:(NSTimer *)timer {
    if (self.isClockedIn) {
        self.elapsedSeconds += 30;
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

    // Random interval between 5 and 12 minutes (300 to 720 seconds)
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
    "  <title>Dynime Time Tracker</title>\n"
    "  <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n"
    "  <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n"
    "  <link href=\"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n"
    "  <style>\n"
    "    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-user-select: none; }\n"
    "    body { background: #090d16; color: #f8fafc; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }\n"
    "    /* Titlebar drag region */\n"
    "    .titlebar { height: 44px; background: transparent; -webkit-app-region: drag; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid rgba(255,255,255,0.05); }\n"
    "    .titlebar-text { font-size: 11px; font-weight: 700; color: #64748b; tracking: 0.05em; text-transform: uppercase; }\n"
    "    .app-container { flex: 1; display: flex; flex-direction: column; padding: 24px; max-width: 960px; margin: 0 auto; width: 100%%; justify-content: center; overflow-y: auto; }\n"
    "    .glass-card { background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); position: relative; overflow: hidden; }\n"
    "    .glow-bg { position: absolute; width: 220px; height: 220px; border-radius: 50%%; background: radial-gradient(circle, rgba(99,102,241,0.25) 0%%, rgba(0,0,0,0) 70%%); pointer-events: none; top: -50px; right: -50px; }\n"
    "    .brand-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }\n"
    "    .brand-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; color: #fff; shadow: 0 4px 12px rgba(99,102,241,0.4); }\n"
    "    .brand-name { font-size: 20px; font-weight: 800; tracking: -0.02em; background: linear-gradient(to right, #fff, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }\n"
    "    \n"
    "    /* Form Controls */\n"
    "    .form-group { margin-bottom: 18px; text-align: left; }\n"
    "    .form-label { display: block; font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 6px; }\n"
    "    .form-input { width: 100%%; padding: 12px 14px; border-radius: 10px; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; font-size: 13px; outline: none; transition: all 0.2s; }\n"
    "    .form-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); background: rgba(30, 41, 59, 0.95); }\n"
    "    .btn-primary { width: 100%%; padding: 14px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; font-size: 14px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35); display: flex; align-items: center; justify-content: center; gap: 8px; }\n"
    "    .btn-primary:hover { opacity: 0.95; transform: translateY(-1px); }\n"
    "    .btn-primary:active { transform: translateY(0); }\n"
    "    \n"
    "    /* Status Pill */\n"
    "    .status-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; border: 1px solid rgba(255,255,255,0.1); }\n"
    "    .status-pill.active { background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(16, 185, 129, 0.3); }\n"
    "    .status-pill.idle { background: rgba(244, 63, 94, 0.15); color: #fb7185; border-color: rgba(244, 63, 94, 0.3); }\n"
    "    .pulse-dot { width: 8px; height: 8px; border-radius: 50%%; background: currentColor; animation: pulse 1.5s infinite; }\n"
    "    @keyframes pulse { 0%% { opacity: 0.4; transform: scale(0.9); } 50%% { opacity: 1; transform: scale(1.15); } 100%% { opacity: 0.4; transform: scale(0.9); } }\n"
    "    \n"
    "    /* Live Digital Timer */\n"
    "    .timer-display { font-size: 64px; font-weight: 800; letter-spacing: -0.04em; text-align: center; margin: 24px 0 16px; font-variant-numeric: tabular-nums; background: linear-gradient(180deg, #ffffff 0%%, #94a3b8 100%%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5)); }\n"
    "    \n"
    "    /* Actions & Toggle */\n"
    "    .btn-clock { width: 100%%; max-width: 380px; margin: 0 auto; padding: 18px 24px; border-radius: 16px; font-size: 16px; font-weight: 800; border: none; cursor: pointer; transition: all 0.25s; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }\n"
    "    .btn-clock-in { background: linear-gradient(135deg, #10b981, #059669); color: #fff; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.35); }\n"
    "    .btn-clock-in:hover { transform: translateY(-2px); box-shadow: 0 14px 35px rgba(16, 185, 129, 0.5); }\n"
    "    .btn-clock-out { background: linear-gradient(135deg, #f43f5e, #e11d48); color: #fff; box-shadow: 0 10px 30px rgba(244, 63, 94, 0.35); }\n"
    "    .btn-clock-out:hover { transform: translateY(-2px); box-shadow: 0 14px 35px rgba(244, 63, 94, 0.5); }\n"
    "    \n"
    "    /* Grid Stats */\n"
    "    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 28px; }\n"
    "    .stat-card { background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 16px; text-align: center; }\n"
    "    .stat-val { font-size: 18px; font-weight: 800; color: #fff; margin-top: 4px; }\n"
    "    .stat-lbl { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }\n"
    "    \n"
    "    /* User Header */\n"
    "    .user-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 20px; margin-bottom: 24px; }\n"
    "    .user-info { display: flex; align-items: center; gap: 14px; }\n"
    "    .avatar { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #a855f7); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #fff; border: 2px solid rgba(255,255,255,0.1); object-fit: cover; }\n"
    "    .user-details h4 { font-size: 15px; font-weight: 700; color: #fff; }\n"
    "    .user-details p { font-size: 12px; color: #94a3b8; font-weight: 500; }\n"
    "    .btn-logout { padding: 8px 16px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #cbd5e1; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }\n"
    "    .btn-logout:hover { background: rgba(244, 63, 94, 0.2); color: #fb7185; border-color: rgba(244,63,94,0.3); }\n"
    "    \n"
    "    .alert-banner { padding: 12px 16px; border-radius: 10px; background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: #fb7185; font-size: 12px; font-weight: 600; margin-bottom: 16px; display: none; text-align: left; }\n"
    "    .sync-text { font-size: 11px; color: #64748b; margin-top: 14px; text-align: center; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 6px; }\n"
    "    .sync-dot { width: 6px; height: 6px; border-radius: 50%%; background: #34d399; }\n"
    "  </style>\n"
    "</head>\n"
    "<body>\n"
    "  <div class=\"titlebar\">\n"
    "    <div class=\"titlebar-text\">Dynime Time Tracker &bull; macOS Client v2.4</div>\n"
    "  </div>\n"
    "\n"
    "  <div class=\"app-container\">\n"
    "    <!-- LOGIN VIEW -->\n"
    "    <div id=\"loginView\" class=\"glass-card\" style=\"max-width: 440px; margin: 0 auto; width: 100%%;\">\n"
    "      <div class=\"glow-bg\"></div>\n"
    "      <div class=\"brand-logo\">\n"
    "        <div class=\"brand-icon\">D</div>\n"
    "        <div class=\"brand-name\">dynime</div>\n"
    "      </div>\n"
    "      <h3 style=\"font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 6px; text-align: left;\">Sign In to Time Tracker</h3>\n"
    "      <p style=\"font-size: 12px; color: #94a3b8; margin-bottom: 20px; text-align: left;\">Enter your Dynime ERP credentials to begin automated tracking & sync.</p>\n"
    "      \n"
    "      <div id=\"loginAlert\" class=\"alert-banner\"></div>\n"
    "      \n"
    "      <!-- Tab Selection -->\n"
    "      <div style=\"display: flex; gap: 8px; margin-bottom: 18px;\">\n"
    "        <button id=\"tabCreds\" type=\"button\" onclick=\"switchLoginTab('creds')\" style=\"flex: 1; padding: 8px; border-radius: 8px; background: rgba(99,102,241,0.2); border: 1px solid #6366f1; color: #fff; font-size: 11px; font-weight: 700; cursor: pointer;\">ERP Account Login</button>\n"
    "        <button id=\"tabToken\" type=\"button\" onclick=\"switchLoginTab('token')\" style=\"flex: 1; padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-size: 11px; font-weight: 700; cursor: pointer;\">App Pairing Key</button>\n"
    "      </div>\n"
    "\n"
    "      <form id=\"formCreds\" onsubmit=\"handleLoginSubmit(event)\">\n"
    "        <div class=\"form-group\">\n"
    "          <label class=\"form-label\">ERP Server Domain</label>\n"
    "          <input type=\"text\" id=\"inputBaseUrl\" class=\"form-input\" value=\"%@\" placeholder=\"https://app.dynime.com\" required />\n"
    "        </div>\n"
    "        <div class=\"form-group\">\n"
    "          <label class=\"form-label\">Email Address</label>\n"
    "          <input type=\"email\" id=\"inputEmail\" class=\"form-input\" placeholder=\"you@company.com\" required />\n"
    "        </div>\n"
    "        <div class=\"form-group\">\n"
    "          <label class=\"form-label\">Password</label>\n"
    "          <input type=\"password\" id=\"inputPassword\" class=\"form-input\" placeholder=\"••••••••\" required />\n"
    "        </div>\n"
    "        <button type=\"submit\" id=\"btnLogin\" class=\"btn-primary\">\n"
    "          <span>Sign In & Start Sync</span>\n"
    "        </button>\n"
    "      </form>\n"
    "\n"
    "      <form id=\"formToken\" onsubmit=\"handleTokenSubmit(event)\" style=\"display: none;\">\n"
    "        <div class=\"form-group\">\n"
    "          <label class=\"form-label\">ERP Server Domain</label>\n"
    "          <input type=\"text\" id=\"inputTokenBaseUrl\" class=\"form-input\" value=\"%@\" placeholder=\"https://app.dynime.com\" required />\n"
    "        </div>\n"
    "        <div class=\"form-group\">\n"
    "          <label class=\"form-label\">App Pairing Token Key</label>\n"
    "          <input type=\"text\" id=\"inputPairingKey\" class=\"form-input\" placeholder=\"Paste token key from ERP portal\" required />\n"
    "        </div>\n"
    "        <button type=\"submit\" class=\"btn-primary\">\n"
    "          <span>Connect with Pairing Key</span>\n"
    "        </button>\n"
    "      </form>\n"
    "    </div>\n"
    "\n"
    "    <!-- MAIN DASHBOARD VIEW -->\n"
    "    <div id=\"dashView\" class=\"glass-card\" style=\"display: none;\">\n"
    "      <div class=\"glow-bg\"></div>\n"
    "      \n"
    "      <div class=\"user-header\">\n"
    "        <div class=\"user-info\">\n"
    "          <div id=\"userAvatar\" class=\"avatar\">U</div>\n"
    "          <div class=\"user-details\">\n"
    "            <h4 id=\"userNameText\">Employee Name</h4>\n"
    "            <p id=\"userDesignationText\">Staff Member &bull; Dynime ERP</p>\n"
    "          </div>\n"
    "        </div>\n"
    "        <div style=\"display: flex; gap: 8px; align-items: center;\">\n"
    "          <button onclick=\"fetchTrackerStatus()\" class=\"btn-logout\" style=\"padding: 8px 12px;\">🔄 Sync</button>\n"
    "          <button onclick=\"handleLogout()\" class=\"btn-logout\">Logout</button>\n"
    "        </div>\n"
    "      </div>\n"
    "\n"
    "      <div style=\"text-align: center;\">\n"
    "        <div id=\"statusPill\" class=\"status-pill idle\">\n"
    "          <span class=\"pulse-dot\"></span>\n"
    "          <span id=\"statusPillText\">Clocked Out &bull; Idle</span>\n"
    "        </div>\n"
    "\n"
    "        <div id=\"timerDisplay\" class=\"timer-display\">00:00:00</div>\n"
    "\n"
    "        <button id=\"btnClockToggle\" onclick=\"toggleClockState()\" class=\"btn-clock btn-clock-in\">\n"
    "          <span id=\"btnClockIcon\">▶</span>\n"
    "          <span id=\"btnClockText\">Clock In Now</span>\n"
    "        </button>\n"
    "\n"
    "        <div class=\"sync-text\">\n"
    "          <span class=\"sync-dot\"></span>\n"
    "          <span id=\"syncStatusText\">Auto-synced with ERP backend &bull; Background screenshots active</span>\n"
    "        </div>\n"
    "      </div>\n"
    "\n"
    "      <div class=\"stats-grid\">\n"
    "        <div class=\"stat-card\">\n"
    "          <div class=\"stat-lbl\">Today Total</div>\n"
    "          <div id=\"statTotalHours\" class=\"stat-val\">0.00 hrs</div>\n"
    "        </div>\n"
    "        <div class=\"stat-card\">\n"
    "          <div class=\"stat-lbl\">Clocked In At</div>\n"
    "          <div id=\"statClockInTime\" class=\"stat-val\">--:--</div>\n"
    "        </div>\n"
    "        <div class=\"stat-card\">\n"
    "          <div class=\"stat-lbl\">Auto Screenshots</div>\n"
    "          <div id=\"statSnapshots\" class=\"stat-val\">Random (5-12m)</div>\n"
    "        </div>\n"
    "      </div>\n"
    "    </div>\n"
    "  </div>\n"
    "\n"
    "  <script>\n"
    "    let state = {\n"
    "      token: '%@',\n"
    "      baseUrl: '%@',\n"
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
    "        document.getElementById('tabCreds').style.background = 'rgba(99,102,241,0.2)';\n"
    "        document.getElementById('tabCreds').style.color = '#fff';\n"
    "        document.getElementById('tabToken').style.background = 'rgba(255,255,255,0.05)';\n"
    "        document.getElementById('tabToken').style.color = '#94a3b8';\n"
    "      } else {\n"
    "        document.getElementById('formCreds').style.display = 'none';\n"
    "        document.getElementById('formToken').style.display = 'block';\n"
    "        document.getElementById('tabToken').style.background = 'rgba(99,102,241,0.2)';\n"
    "        document.getElementById('tabToken').style.color = '#fff';\n"
    "        document.getElementById('tabCreds').style.background = 'rgba(255,255,255,0.05)';\n"
    "        document.getElementById('tabCreds').style.color = '#94a3b8';\n"
    "      }\n"
    "    }\n"
    "\n"
    "    function showLoginAlert(msg) {\n"
    "      const el = document.getElementById('loginAlert');\n"
    "      el.innerText = msg;\n"
    "      el.style.display = 'block';\n"
    "    }\n"
    "    function hideLoginAlert() { document.getElementById('loginAlert').style.display = 'none'; }\n"

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
    "          callNative('saveAuth', { token: state.token, baseUrl: state.baseUrl, email: email, name: state.user.name });\n"
    "          callNative('notify', { title: 'Welcome Back', message: `Signed in as ${state.user.name}` });\n"
    "          showDashboardView();\n"
    "          fetchTrackerStatus();\n"
    "        } else {\n"
    "          showLoginAlert(data.message || 'Invalid email or password credentials.');\n"
    "        }\n"
    "      } catch (err) {\n"
    "        showLoginAlert('Unable to connect to ERP server. Check URL.');\n"
    "      } finally {\n"
    "        btn.innerText = 'Sign In & Start Sync';\n"
    "        btn.disabled = false;\n"
    "      }\n"
    "    }\n"
    "\n"
    "    function handleTokenSubmit(e) {\n"
    "      e.preventDefault();\n"
    "      const baseUrl = document.getElementById('inputTokenBaseUrl').value.trim().replace(/\\/$/, '');\n"
    "      const key = document.getElementById('inputPairingKey').value.trim();\n"
    "      if (!key) return;\n"
    "      state.token = key;\n"
    "      state.baseUrl = baseUrl;\n"
    "      callNative('saveAuth', { token: key, baseUrl: baseUrl, email: 'pairing_key', name: 'Time Tracker User' });\n"
    "      showDashboardView();\n"
    "      fetchTrackerStatus();\n"
    "    }\n"
    "\n"
    "    function showLoginView() {\n"
    "      document.getElementById('loginView').style.display = 'block';\n"
    "      document.getElementById('dashView').style.display = 'none';\n"
    "    }\n"
    "\n"
    "    function showDashboardView() {\n"
    "      document.getElementById('loginView').style.display = 'none';\n"
    "      document.getElementById('dashView').style.display = 'block';\n"
    "    }\n"
    "\n"
    "    async function fetchTrackerStatus() {\n"
    "      if (!state.token) return;\n"
    "      try {\n"
    "        const res = await fetch(`${state.baseUrl}/api/time-tracker/status`, {\n"
    "          headers: { 'Authorization': `Bearer ${state.token}`, 'Accept': 'application/json' }\n"
    "        });\n"
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
    "            document.getElementById('userDesignationText').innerText = `${d.employee.designation} • ID: ${d.employee.employee_id}`;\n"
    "          }\n"
    "          if (d.timer) {\n"
    "            document.getElementById('statTotalHours').innerText = `${d.timer.total_hours_today} hrs`;\n"
    "            document.getElementById('statClockInTime').innerText = d.timer.clock_in_time || '--:--';\n"
    "            setClockedInState(d.timer.is_clocked_in, Math.round((d.timer.total_hours_today || 0) * 3600));\n"
    "          }\n"
    "        }\n"
    "      } catch(err) { console.error('Status fetch error:', err); }\n"
    "    }\n"
    "\n"
    "    function setClockedInState(isClockedIn, totalSecs) {\n"
    "      state.isClockedIn = isClockedIn;\n"
    "      if (totalSecs !== undefined && totalSecs > state.elapsedSeconds) {\n"
    "        state.elapsedSeconds = totalSecs;\n"
    "      }\n"
    "      const pill = document.getElementById('statusPill');\n"
    "      const pillTxt = document.getElementById('statusPillText');\n"
    "      const btn = document.getElementById('btnClockToggle');\n"
    "      const btnTxt = document.getElementById('btnClockText');\n"
    "      const btnIcon = document.getElementById('btnClockIcon');\n"
    "\n"
    "      if (isClockedIn) {\n"
    "        pill.className = 'status-pill active';\n"
    "        pillTxt.innerText = 'Clocked In • Shift Active';\n"
    "        btn.className = 'btn-clock btn-clock-out';\n"
    "        btnTxt.innerText = 'Clock Out & Stop Shift';\n"
    "        btnIcon.innerText = '⏹';\n"
    "        startLocalTimer();\n"
    "      } else {\n"
    "        pill.className = 'status-pill idle';\n"
    "        pillTxt.innerText = 'Clocked Out • Idle';\n"
    "        btn.className = 'btn-clock btn-clock-in';\n"
    "        btnTxt.innerText = 'Clock In Now';\n"
    "        btnIcon.innerText = '▶';\n"
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
    "      if (!state.token) return;\n"
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
    "        const data = await res.json();\n"
    "        if (data.success) {\n"
    "          const newClockState = !state.isClockedIn;\n"
    "          setClockedInState(newClockState, state.elapsedSeconds);\n"
    "          callNative('notify', {\n"
    "            title: newClockState ? 'Clock-In Success' : 'Clock-Out Completed',\n"
    "            message: newClockState ? 'Time tracking and random screenshots active.' : 'Shift session saved to Dynime ERP.'\n"
    "          });\n"
    "          if (newClockState) {\n"
    "            callNative('triggerScreenshot', {});\n"
    "          }\n"
    "          fetchTrackerStatus();\n"
    "        } else {\n"
    "          alert(data.message || 'Clock toggle failed');\n"
    "        }\n"
    "      } catch(err) {\n"
    "        alert('Server connection error while toggling clock.');\n"
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
    "    window.onScreenshotUploadedSuccess = function() {\n"
    "      document.getElementById('statSnapshots').innerText = 'Captured (Just Now)';\n"
    "      setTimeout(() => {\n"
    "        document.getElementById('statSnapshots').innerText = 'Random (5-12m)';\n"
    "      }, 4000);\n"
    "    };\n"
    "\n"
    "    function handleLogout() {\n"
    "      stopLocalTimer();\n"
    "      state.token = '';\n"
    "      state.isClockedIn = false;\n"
    "      state.elapsedSeconds = 0;\n"
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
        AppDelegate *delegate = [[AppDelegate alloc] init];
        [app setDelegate:delegate];
        [app run];
    }
    return 0;
}
