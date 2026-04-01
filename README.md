# Window Gestures

Window Gestures is GNOME Shell extension for managing window with touchpad gestures.
Supports GNOME 45-49.

## Installation
[![Get from GNOME Extension](./gext.svg)](https://extensions.gnome.org/extension/6343/window-gestures/)


## Features
 * Customizable actions for gestures
 * Support `3` or `4` fingers swipe, pinch & hold
 * Swappable 3 / 4 fingers
 * Enable/disable functions in settings
 * With kinetic gesture
 * With adaptive transition interpolable with gesture state

## Window Gestures
 * Swipe `4` Fingers `up` - **Maximize, fullscreen, restore**
 * Swipe `4` Fingers `up + left` or `right` - **Snap window left/right**
 * Swipe `4` Fingers Down - **Move window** `Tap & Hold Disable`
 * Tap & Hold `4` Fingers - **Move/resize window**

## Configurable Gestures
 * Swipe 4 Fingers Left, Right, Down
 * Swipe 3 Fingers Down, Down+Left, Down+Right, Down+Up
 * Pinch In/Out 3/4 Fingers
 * Tap &amp; Hold to move/resize window

## Actions
 * Minimize window
 * Close window
 * Show desktop
 * Next window
 * Previous window
 * Send window left
 * Send window right
 * Back
 * Forward
 * Brightness up
 * Brightness down
 * Volume up
 * Volume down
 * Mute
 * Media play
 * Media next
 * Media previous
 * Alt+Tab switch
 * Overview
 * Application Grid
 * Quick settings
 * Notification
 * Run (Alt+F2)
 * **Send keystrokes** - map any gesture to a custom key combination

### Send Keystrokes

The **Send keystrokes** action lets you map any gesture to an arbitrary keyboard shortcut. When selected in the preferences dropdown, an entry row appears where you can:

 * **Type** a GTK accelerator string directly (e.g. `<Control><Shift>t`, `<Super>e`, `<Alt>F4`)
 * **Record** a shortcut by clicking the "Record" button and pressing the desired key combination

Keystrokes repeat during a continuous swipe -- each unit of swipe distance fires the keystroke again. This makes it ideal for actions like cycling through browser tabs with `<Control>Page_Down` / `<Control>Page_Up`.

#### Accelerator format

| Format | Keys sent |
|--------|-----------|
| `<Control>c` | Ctrl+C |
| `<Control><Shift>t` | Ctrl+Shift+T |
| `<Super>e` | Super+E |
| `<Alt>F4` | Alt+F4 |
| `F5` | F5 |
| `<Control>Page_Down` | Ctrl+Page Down |

Supported modifiers: `Control` (or `Ctrl`), `Shift`, `Alt`, `Super`, `Meta`, `Primary` (alias for Control).

## Tests

Run the test suite with:

```
node tests/test-keystroke-feature.js
```

## Demo
 [![Improve Touchpad GNOME Experience with Window Gesture](https://img.youtube.com/vi/HHDjraAE6sc/0.jpg)](https://www.youtube.com/watch?v=HHDjraAE6sc)

 [![Gnome Extension - My Window Gestures](https://img.youtube.com/vi/yMUYB3OFpBQ/0.jpg)](https://www.youtube.com/watch?v=yMUYB3OFpBQ)

## License

My Window Gestures are distributed under the terms of the GNU General
Public License, version 2 or later. See the [license](COPYING) for details.
Individual extensions may be licensed under different terms, see each source
file for details.
