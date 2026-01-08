const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withNetworkSecurityConfig(config) {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');

            // Create xml directory if it doesn't exist
            if (!fs.existsSync(xmlDir)) {
                fs.mkdirSync(xmlDir, { recursive: true });
            }

            const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.0.109</domain>
        <domain includeSubdomains="true">192.168.0.102</domain>
        <domain includeSubdomains="true">192.168.0.104</domain>
        <domain includeSubdomains="true">192.168.0.103</domain>
        <domain includeSubdomains="true">192.168.0.100</domain>
        <domain includeSubdomains="true">192.168.0.101</domain>
        <domain includeSubdomains="true">192.168.0.57</domain>
        <domain includeSubdomains="true">192.168.0.177</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>`;

            fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'), networkSecurityConfig);

            return config;
        },
    ]);
};
