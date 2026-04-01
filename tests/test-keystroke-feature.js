#!/usr/bin/env node

/**
 * Tests for the "Send Keystrokes" feature (action ID 24).
 *
 * Covers:
 *   1. _parseAccelerator – GTK accelerator string → Clutter keyval array
 *   2. Action 24 repeat logic – distance-based keystroke firing
 *   3. Schema validation – all required GSettings keys present
 *   4. Prefs integration – action list index, entry row visibility logic
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..', 'src');

// ─── Clutter KEY constants (subset matching extension.js usage) ─────────────
const Clutter = {
    KEY_Control_L: 0xffe3, KEY_Control_R: 0xffe4,
    KEY_Shift_L: 0xffe1, KEY_Shift_R: 0xffe2,
    KEY_Alt_L: 0xffe9, KEY_Alt_R: 0xffea,
    KEY_Super_L: 0xffeb, KEY_Super_R: 0xffec,
    KEY_Meta_L: 0xffe7, KEY_Meta_R: 0xffe8,
    KEY_a: 0x061, KEY_b: 0x062, KEY_c: 0x063, KEY_d: 0x064, KEY_e: 0x065,
    KEY_t: 0x074, KEY_v: 0x076, KEY_z: 0x07a,
    KEY_F1: 0xffbe, KEY_F2: 0xffbf, KEY_F3: 0xffc0, KEY_F4: 0xffc1,
    KEY_F5: 0xffc2, KEY_F11: 0xffc8, KEY_F12: 0xffc9,
    KEY_Tab: 0xff09, KEY_Return: 0xff0d, KEY_space: 0x020,
    KEY_Escape: 0xff1b, KEY_BackSpace: 0xff08, KEY_Delete: 0xffff,
    KEY_Left: 0xff51, KEY_Right: 0xff53, KEY_Up: 0xff52, KEY_Down: 0xff54,
    KEY_Home: 0xff50, KEY_End: 0xff57,
    KEY_Page_Up: 0xff55, KEY_Page_Down: 0xff56,
    KEY_Print: 0xff61,
};

// ─── _parseAccelerator (copied from extension.js for unit testing) ──────────
function _parseAccelerator(accel) {
    if (!accel) return null;
    let keys = [];
    let remaining = accel;

    const modMap = {
        'control': Clutter.KEY_Control_L,
        'ctrl': Clutter.KEY_Control_L,
        'shift': Clutter.KEY_Shift_L,
        'alt': Clutter.KEY_Alt_L,
        'super': Clutter.KEY_Super_L,
        'meta': Clutter.KEY_Meta_L,
        'primary': Clutter.KEY_Control_L,
    };

    let match;
    while ((match = remaining.match(/^<(\w+)>/))) {
        let mod = match[1].toLowerCase();
        if (modMap[mod]) {
            keys.push(modMap[mod]);
        }
        remaining = remaining.substring(match[0].length);
    }

    if (remaining.length > 0) {
        if (remaining.length === 1) {
            let keyval = Clutter['KEY_' + remaining.toLowerCase()];
            if (keyval) keys.push(keyval);
        } else {
            let keyval = Clutter['KEY_' + remaining];
            if (keyval) {
                keys.push(keyval);
            } else {
                let keyval2 = Clutter['KEY_' + remaining.charAt(0).toUpperCase()
                    + remaining.slice(1).toLowerCase()];
                if (keyval2) keys.push(keyval2);
            }
        }
    }

    return keys.length > 0 ? keys : null;
}

// ─── Repeat-logic simulator (mirrors action 24 handler) ────────────────────
function createRepeatSim() {
    let actionWidgets = {};
    let fireCount = 0;

    function simulate(state, progress, oprog) {
        let wid = 'keystroke_count';
        if (!state) {
            let count = Math.floor(oprog || 0);
            let prev = actionWidgets[wid] || 0;
            if (count > prev) {
                for (let i = prev; i < count; i++) {
                    fireCount++;
                }
                actionWidgets[wid] = count;
            }
        } else {
            let prev = actionWidgets[wid] || 0;
            if (prev === 0 && progress >= 1.0) {
                fireCount++;
            }
            actionWidgets[wid] = 0;
        }
    }

    return {
        simulate,
        get fireCount() { return fireCount; },
        reset() { fireCount = 0; actionWidgets = {}; },
    };
}

// ─── Test runner ────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
let sectionName = '';

function section(name) {
    sectionName = name;
    console.log(`\n── ${name} ──`);
}

function assert(name, condition) {
    if (condition) {
        passed++;
        console.log(`  PASS  ${name}`);
    } else {
        failed++;
        console.log(`  FAIL  ${name}`);
    }
}

function assertEq(name, actual, expected) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a === e) {
        passed++;
        console.log(`  PASS  ${name}`);
    } else {
        failed++;
        console.log(`  FAIL  ${name}`);
        console.log(`        expected: ${e}`);
        console.log(`        actual:   ${a}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  1. _parseAccelerator
// ═══════════════════════════════════════════════════════════════════════════
section('parseAccelerator – basic modifiers + key');
assertEq('Ctrl+Shift+t',
    _parseAccelerator('<Control><Shift>t'),
    [Clutter.KEY_Control_L, Clutter.KEY_Shift_L, Clutter.KEY_t]);
assertEq('Super+e',
    _parseAccelerator('<Super>e'),
    [Clutter.KEY_Super_L, Clutter.KEY_e]);
assertEq('Alt+F2',
    _parseAccelerator('<Alt>F2'),
    [Clutter.KEY_Alt_L, Clutter.KEY_F2]);
assertEq('Ctrl+a (short alias)',
    _parseAccelerator('<Ctrl>a'),
    [Clutter.KEY_Control_L, Clutter.KEY_a]);
assertEq('Primary+z (alias)',
    _parseAccelerator('<Primary>z'),
    [Clutter.KEY_Control_L, Clutter.KEY_z]);
assertEq('Meta+d',
    _parseAccelerator('<Meta>d'),
    [Clutter.KEY_Meta_L, Clutter.KEY_d]);

section('parseAccelerator – single keys (no modifier)');
assertEq('F5', _parseAccelerator('F5'), [Clutter.KEY_F5]);
assertEq('F11', _parseAccelerator('F11'), [Clutter.KEY_F11]);
assertEq('F12', _parseAccelerator('F12'), [Clutter.KEY_F12]);
assertEq('Return', _parseAccelerator('Return'), [Clutter.KEY_Return]);
assertEq('Tab', _parseAccelerator('Tab'), [Clutter.KEY_Tab]);
assertEq('Escape', _parseAccelerator('Escape'), [Clutter.KEY_Escape]);
assertEq('BackSpace', _parseAccelerator('BackSpace'), [Clutter.KEY_BackSpace]);
assertEq('Delete', _parseAccelerator('Delete'), [Clutter.KEY_Delete]);
assertEq('space', _parseAccelerator('space'), [Clutter.KEY_space]);
assertEq('Print', _parseAccelerator('Print'), [Clutter.KEY_Print]);

section('parseAccelerator – navigation keys with modifiers');
assertEq('Ctrl+Page_Down',
    _parseAccelerator('<Control>Page_Down'),
    [Clutter.KEY_Control_L, Clutter.KEY_Page_Down]);
assertEq('Ctrl+Page_Up',
    _parseAccelerator('<Control>Page_Up'),
    [Clutter.KEY_Control_L, Clutter.KEY_Page_Up]);
assertEq('Super+Left',
    _parseAccelerator('<Super>Left'),
    [Clutter.KEY_Super_L, Clutter.KEY_Left]);
assertEq('Ctrl+Home',
    _parseAccelerator('<Control>Home'),
    [Clutter.KEY_Control_L, Clutter.KEY_Home]);
assertEq('Ctrl+End',
    _parseAccelerator('<Control>End'),
    [Clutter.KEY_Control_L, Clutter.KEY_End]);

section('parseAccelerator – multi-modifier combinations');
assertEq('Ctrl+Alt+Delete',
    _parseAccelerator('<Control><Alt>Delete'),
    [Clutter.KEY_Control_L, Clutter.KEY_Alt_L, Clutter.KEY_Delete]);
assertEq('Ctrl+Shift+Alt+F4',
    _parseAccelerator('<Control><Shift><Alt>F4'),
    [Clutter.KEY_Control_L, Clutter.KEY_Shift_L, Clutter.KEY_Alt_L, Clutter.KEY_F4]);
assertEq('Super+Shift+Page_Up',
    _parseAccelerator('<Super><Shift>Page_Up'),
    [Clutter.KEY_Super_L, Clutter.KEY_Shift_L, Clutter.KEY_Page_Up]);

section('parseAccelerator – edge cases');
assertEq('null input', _parseAccelerator(null), null);
assertEq('empty string', _parseAccelerator(''), null);
assertEq('unknown key ignores key but keeps modifier',
    _parseAccelerator('<Control>NonExistentKey'),
    [Clutter.KEY_Control_L]);
assertEq('modifier-only tag returns just the modifier',
    _parseAccelerator('<Control>'),
    [Clutter.KEY_Control_L]);
assertEq('modifier-only Shift',
    _parseAccelerator('<Shift>'),
    [Clutter.KEY_Shift_L]);


// ═══════════════════════════════════════════════════════════════════════════
//  2. Action 24 repeat logic
// ═══════════════════════════════════════════════════════════════════════════
section('repeat logic – continuous swipe crossing multiple units');
{
    const sim = createRepeatSim();
    sim.simulate(0, 0.3, 0.3);   // partial
    sim.simulate(0, 0.7, 0.7);   // still partial
    sim.simulate(0, 1.0, 1.2);   // crosses 1.0
    sim.simulate(0, 1.0, 1.8);   // within unit 1
    sim.simulate(0, 1.0, 2.3);   // crosses 2.0
    sim.simulate(0, 1.0, 3.5);   // crosses 3.0
    sim.simulate(1, 1.0);        // end
    assertEq('fires 3 times for 3 units', sim.fireCount, 3);
}

section('repeat logic – single complete swipe');
{
    const sim = createRepeatSim();
    sim.simulate(0, 0.5, 0.5);
    sim.simulate(0, 1.0, 1.1);
    sim.simulate(1, 1.0);
    assertEq('fires once', sim.fireCount, 1);
}

section('repeat logic – incomplete swipe (below threshold)');
{
    const sim = createRepeatSim();
    sim.simulate(0, 0.3, 0.3);
    sim.simulate(0, 0.6, 0.6);
    sim.simulate(1, 0.6);
    assertEq('fires 0 times', sim.fireCount, 0);
}

section('repeat logic – fling completes gesture');
{
    const sim = createRepeatSim();
    sim.simulate(0, 0.5, 0.5);
    sim.simulate(1, 1.0);        // fling reaches 1.0
    assertEq('fires once on fling', sim.fireCount, 1);
}

section('repeat logic – fast swipe (large jump)');
{
    const sim = createRepeatSim();
    sim.simulate(0, 1.0, 5.2);
    sim.simulate(1, 1.0);
    assertEq('fires 5 times', sim.fireCount, 5);
}

section('repeat logic – multiple gestures reset properly');
{
    const sim = createRepeatSim();
    // First gesture
    sim.simulate(0, 1.0, 2.0);
    sim.simulate(1, 1.0);
    assertEq('first gesture fires 2', sim.fireCount, 2);

    sim.reset();
    // Second gesture
    sim.simulate(0, 1.0, 1.5);
    sim.simulate(1, 1.0);
    assertEq('second gesture fires 1', sim.fireCount, 1);
}

section('repeat logic – progress exactly on boundary');
{
    const sim = createRepeatSim();
    sim.simulate(0, 1.0, 1.0);   // exactly 1.0
    sim.simulate(0, 1.0, 2.0);   // exactly 2.0
    sim.simulate(0, 1.0, 3.0);   // exactly 3.0
    sim.simulate(1, 1.0);
    assertEq('fires 3 times on exact boundaries', sim.fireCount, 3);
}

section('repeat logic – no oprog supplied (fling callback)');
{
    const sim = createRepeatSim();
    sim.simulate(0, 0.5, undefined);  // fling update, no oprog
    sim.simulate(1, 1.0);             // fling completes
    assertEq('fires once from fling end', sim.fireCount, 1);
}

// ═══════════════════════════════════════════════════════════════════════════
//  3. Schema validation
// ═══════════════════════════════════════════════════════════════════════════
section('schema – keystroke settings keys exist');
{
    const schema = readFileSync(
        resolve(SRC, 'schemas',
            'org.gnome.shell.extensions.windowgestures.gschema.xml'),
        'utf8');

    const gestureSlots = [
        'swipe4-left', 'swipe4-right', 'swipe4-updown',
        'swipe3-down', 'swipe3-left', 'swipe3-right', 'swipe3-downup',
        'pinch3-in', 'pinch3-out', 'pinch4-in', 'pinch4-out',
    ];

    for (const slot of gestureSlots) {
        const keysName = slot + '-keys';
        assert(`schema has ${keysName}`,
            schema.includes(`name="${keysName}"`));
        assert(`${keysName} is type string`,
            schema.includes(`type="s" name="${keysName}"`));
    }

    // Action integer keys should have range covering 24
    const rangeMatch = schema.match(
        /name="swipe4-left"[\s\S]*?range min="(\d+)" max="(\d+)"/);
    assert('swipe4-left range covers action 24',
        rangeMatch && parseInt(rangeMatch[2]) >= 24);
}

// ═══════════════════════════════════════════════════════════════════════════
//  4. Prefs integration
// ═══════════════════════════════════════════════════════════════════════════
section('prefs – action list contains Send keystrokes at index 24');
{
    const prefs = readFileSync(resolve(SRC, 'prefs.js'), 'utf8');

    assert('action_list includes "Send keystrokes"',
        prefs.includes('"Send keystrokes"'));

    // Verify it's at index 24 by checking the comment
    assert('Send keystrokes has comment // 24',
        prefs.includes('"Send keystrokes",      // 24'));

    assert('_createActionCombo method exists',
        prefs.includes('_createActionCombo('));

    assert('SEND_KEYSTROKES_ID = 24',
        prefs.includes('SEND_KEYSTROKES_ID = 24'));

    assert('Record button exists',
        prefs.includes("label: 'Record'"));

    assert('suggested-action CSS class on Record button',
        prefs.includes("'suggested-action'"));

    assert('_showKeystrokeDialog method exists',
        prefs.includes('_showKeystrokeDialog('));

    assert('uses Gtk.accelerator_name',
        prefs.includes('Gtk.accelerator_name('));
}

// ═══════════════════════════════════════════════════════════════════════════
//  5. Extension integration
// ═══════════════════════════════════════════════════════════════════════════
section('extension – action 24 handler and parser');
{
    const ext = readFileSync(resolve(SRC, 'extension.js'), 'utf8');

    assert('_parseAccelerator method exists',
        ext.includes('_parseAccelerator(accel)'));

    assert('action 24 handler exists',
        ext.includes('id == 24'));

    assert('handler reads slotName from gesture',
        ext.includes('this._gesture.slotName'));

    assert('_actionIdGet stores slotName',
        /this\._gesture\.slotName\s*=\s*cfg_name/.test(ext));

    assert('handler uses keystroke_count for repeat tracking',
        ext.includes("'keystroke_count'"));

    assert('handler uses oprog for distance-based repeat',
        ext.includes('Math.floor(oprog'));

    assert('handler resets counter on gesture end',
        ext.includes("this._actionWidgets[wid] = 0"));
}


// ═══════════════════════════════════════════════════════════════════════════
//  Summary
// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('═'.repeat(50));

process.exit(failed > 0 ? 1 : 0);
