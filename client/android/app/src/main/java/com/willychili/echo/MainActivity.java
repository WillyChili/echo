package com.willychili.echo;

import android.os.Bundle;
import android.view.View;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Edge-to-edge: let the WebView render behind the status bar and
    // navigation bar. CSS env(safe-area-inset-*) + viewport-fit=cover
    // in index.html handle the content padding on the web side.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    // Disable native Android overscroll (rubber-band / stretch / glow EdgeEffect).
    // CSS overscroll-behavior: none has no effect in Capacitor WebViews —
    // this must be set at the native Android layer.
    getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
  }
}
