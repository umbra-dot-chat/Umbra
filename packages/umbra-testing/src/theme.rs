// Catppuccin Mocha color palette for the TUI.
// https://github.com/catppuccin/catppuccin

use ratatui::style::Color;

// ── Base colors ─────────────────────────────────────────────────────────────
pub const BASE: Color = Color::Rgb(30, 30, 46); // #1e1e2e
pub const MANTLE: Color = Color::Rgb(24, 24, 37); // #181825
pub const CRUST: Color = Color::Rgb(17, 17, 27); // #11111b
pub const SURFACE0: Color = Color::Rgb(49, 50, 68); // #313244
pub const SURFACE1: Color = Color::Rgb(69, 71, 90); // #45475a
pub const SURFACE2: Color = Color::Rgb(88, 91, 112); // #585b70

// ── Text colors ─────────────────────────────────────────────────────────────
pub const TEXT: Color = Color::Rgb(205, 214, 244); // #cdd6f4
pub const SUBTEXT0: Color = Color::Rgb(166, 173, 200); // #a6adc8
pub const SUBTEXT1: Color = Color::Rgb(186, 194, 222); // #bac2de
pub const OVERLAY0: Color = Color::Rgb(108, 112, 134); // #6c7086
pub const OVERLAY1: Color = Color::Rgb(127, 132, 156); // #7f849c
pub const OVERLAY2: Color = Color::Rgb(147, 153, 178); // #9399b2

// ── Accent colors ───────────────────────────────────────────────────────────
pub const ROSEWATER: Color = Color::Rgb(245, 224, 220); // #f5e0dc
pub const FLAMINGO: Color = Color::Rgb(242, 205, 205); // #f2cdcd
pub const PINK: Color = Color::Rgb(245, 194, 231); // #f5c2e7
pub const MAUVE: Color = Color::Rgb(203, 166, 247); // #cba6f7
pub const RED: Color = Color::Rgb(243, 139, 168); // #f38ba8
pub const MAROON: Color = Color::Rgb(235, 160, 172); // #eba0ac
pub const PEACH: Color = Color::Rgb(250, 179, 135); // #fab387
pub const YELLOW: Color = Color::Rgb(249, 226, 175); // #f9e2af
pub const GREEN: Color = Color::Rgb(166, 227, 161); // #a6e3a1
pub const TEAL: Color = Color::Rgb(148, 226, 213); // #94e2d5
pub const SKY: Color = Color::Rgb(137, 220, 235); // #89dceb
pub const SAPPHIRE: Color = Color::Rgb(116, 199, 236); // #74c7ec
pub const BLUE: Color = Color::Rgb(137, 180, 250); // #89b4fa
pub const LAVENDER: Color = Color::Rgb(180, 190, 254); // #b4befe

// ── Semantic aliases ────────────────────────────────────────────────────────
pub const BG: Color = BASE;
pub const STATUS_BG: Color = MANTLE;
pub const SELECTED: Color = MAUVE;
pub const CURSOR_BG: Color = SURFACE1;
pub const PASSED: Color = GREEN;
pub const FAILED: Color = RED;
pub const RUNNING: Color = YELLOW;
pub const QUEUED: Color = OVERLAY1;
pub const IDLE: Color = OVERLAY0;
pub const CATEGORY_DETOX: Color = PEACH;
pub const CATEGORY_PLAYWRIGHT: Color = TEAL;
pub const CATEGORY_JEST: Color = SAPPHIRE;
pub const CATEGORY_RUST: Color = MAROON;
pub const BORDER: Color = SURFACE1;
pub const SEARCH_MATCH: Color = YELLOW;
pub const HELP_KEY: Color = MAUVE;
pub const HELP_DESC: Color = TEXT;
