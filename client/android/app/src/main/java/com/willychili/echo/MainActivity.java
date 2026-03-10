package com.willychili.echo;

import android.os.Bundle;
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
  }
}
