# Web Technology and Vulnerability Detection Browser Extension

## Introduction

This project aims to develop a browser extension that combines web crawling, HTTP header analysis, API analysis, and CMS fingerprinting to detect website technologies and their corresponding versions. In addition, it will analyze correlated vulnerabilities in the identified technologies.

The extension will be integrated with public vulnerability databases to automatically search for known vulnerabilities associated with the detected versions. The detected security issues will be displayed directly within the plugin interface, providing users with real-time vulnerability information as they browse websites.

## Features
- **Web Technology Detection**: Identify the technologies used by websites, including front-end and back-end frameworks, CMS platforms, and server configurations.
- **Vulnerability Analysis**: Check the detected technologies against public vulnerability databases (e.g., CVE, NVD) to find associated vulnerabilities.
- **Real-time Security Monitoring**: Analyze websites in real time and display detected security issues directly in the extension.

## File Structure
```
my-extension/
│
├── manifest.json         // 扩展的配置文件
├── background.js         // 后台脚本，处理URL、HTTP headers 和 数据逻辑
├── content_script.js     // 页面内容脚本，分析HTML内容
├── popup.html            // 弹出窗口的用户界面
├── popup.js              // 控制弹出窗口中如何显示分析结果
├── css/
│   └── style.css         // 样式文件，控制页面展示的样式
└── img/
    ├── icon16.png        // 16x16 图标
    ├── icon48.png        // 48x48 图标
    └── icon128.png       // 128x128 图标
```
  
## Proposed Methodology and Approach

### 1. Identify Website Technology

- **HTTP Header Analysis**: Extract technology and version information from HTTP headers (e.g., WordPress, Node.js, React, Apache).
  
- **API Response Analysis**: Many websites expose REST or GraphQL APIs. These APIs can provide valuable information about backend technology and version through:
  - API Response Headers
  - API Versions
  - Error Responses

- **CMS Fingerprinting**: By targeting specific paths or files associated with popular CMS platforms (e.g., WordPress, Drupal), we can fingerprint CMS versions and determine the platform being used.

- **Webpage Crawling**: Crawl the webpage and identify CMS-related information or other details that indicate the technologies being used.

### 2. Vulnerability Detection

- **Using CVE (Common Vulnerabilities and Exposures) or NVD (National Vulnerability Database) API**: Identify vulnerabilities in the technologies detected by the extension.

- **Real-time Detection**: Create a mechanism to detect vulnerabilities in real time whenever a webpage is loaded. The extension will automatically check for vulnerabilities related to the detected technology versions and display them in the plugin interface.

## Future Plans
- Improve the accuracy of technology detection by expanding the fingerprinting database.
- Add more public vulnerability databases for cross-referencing.
- Provide users with suggestions on how to mitigate detected vulnerabilities.

## How to Install
1. Clone this repository.
2. Open your browser's extensions page (for Chrome: `chrome://extensions/`).
3. Enable Developer Mode.
4. Click "Load unpacked" and select the repository folder.
5. The extension should now be installed and ready for use.

## License
This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.

## Contributing
Contributions are welcome! Feel free to submit issues or pull requests to help improve the project.

