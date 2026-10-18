<h1 align="center"> ✨ Liquify Theme Spicetify ✨ </h1>

<p align="center">
  <b>A modern, rounded and liquified theme for spicetify</b><br>
</p>

## Contents

<!-- toc -->

- [Introduction](#introduction)
- [Installation](#installation)
- [Theme screenshots](#theme-screenshots)
- [Features](#features)
- [Compatibility fixes](#compatibility-fixes)
<!-- tocstop -->

## Introduction

**Liquify** - is a glassmorphic Spicetify theme for Spotify featuring a modern, luminous interface and smooth animations.

Liquify is inspired by [Glassify](https://github.com/sanoojes/spicetify-glassify) from [Sanoojes](https://github.com/sanoojes).

If your transparent controls don’t look fully transparent — for example when zooming in on Spotify — you can easily change the width and height of them in the Liquify Settings to make them fully transparent again.

If you like the theme, consider starring the repository on GitHub! ⭐

**For support join the Discord!**:

<a href="https://discord.gg/QRMnrgjhvq" target="_blank">
  <img src="discord-icon.png" alt="Discord-server-link" width="64" />
</a>

## Installation

With Spicetify installed, place this folder in its `Themes` directory, then run:

```powershell
spicetify config current_theme Liquify-main
spicetify apply
```

If you rename the folder, replace `Liquify-main` with its exact name. The root `theme.js`, `user.css` and `color.ini` are ready to use; no build step, Node.js or PowerShell helper script is required.

Liquid Lyrics is a separate extension. This theme includes compatibility fixes for its sidebar card; the extension itself must be installed separately.

## Theme screenshots

<details>
<summary>Click to watch screenshots</summary>
<img width="1919" height="1029" alt="Homescreen" src="https://github.com/user-attachments/assets/a7d50e6e-56be-4a8b-8ea6-8835655d4cdf" />

<img width="1919" height="1029" alt="Playlist" src="https://github.com/user-attachments/assets/5375a463-10a4-428e-8e5c-f43d76e03509" />

<img width="1919" height="1030" alt="Search" src="https://github.com/user-attachments/assets/71d1c7a5-bca6-47d3-880c-8c0e85c45bce" />

<img width="1919" height="1030" alt="Artist-Page" src="https://github.com/user-attachments/assets/60151e06-8a6a-4548-a882-1c267c18e7ca" />

<img width="1919" height="1028" alt="Artist-Page2" src="https://github.com/user-attachments/assets/fa9bdb4f-666e-4380-9ee3-2da6b33be730" />

<img width="1919" height="1030" alt="Liquify-Settings" src="https://github.com/user-attachments/assets/0ab96146-4868-468c-8a22-7cb03fa992c1" />

<img width="1919" height="1030" alt="Popup" src="https://github.com/user-attachments/assets/59b2f2e9-b273-4f2a-9d06-7e562be21f8d" />

<img width="1919" height="1029" alt="Settings" src="https://github.com/user-attachments/assets/f37cfbef-7d3e-4ed4-bab5-0dfeae4362aa" />

<img width="1919" height="1030" alt="Fullscreen" src="https://github.com/user-attachments/assets/7b147a4f-6f48-4123-bf65-96b4a94d44e0" />

</details>

---

## Features

**Liquify offers:**

- Many customization options
-  `Beatiful Lyrics`, `Spicy Lyrics` and `Lucid Lyrics` are supported by default
- Beautiful dynamic colors (Just enable dynamic button colors in the settings and your good to go)
- Modern, rounded UI
- And much more!

## Compatibility fixes

This distribution includes fixes checked on Spotify **1.3.6.1912.g625421345c47** with Spicetify **2.45.3** on October 17, 2026. All changes are included directly in `theme.js` and `user.css`.

- Restored transparent containers, artist page scrolling, home filters, rounded shortcut cards, sidebar cards and profile menus.
- Restored the bottom player, expanded player, mini-player, cover effects and Liquid Lyrics mounting points.
- Fixed equalizer and output-device panel colors, typography, settings import/export and visualizers.
- Replaced version-dependent selectors where possible with component names and semantic attributes.

## Credits

Created by NMW.

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See [LICENSE.txt](LICENSE.txt) for details.
