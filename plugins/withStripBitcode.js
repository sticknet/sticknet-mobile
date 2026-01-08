const { withXcodeProject } = require('@expo/config-plugins');

module.exports = (config) => {
    return withXcodeProject(config, (config) => {
        const xcodeProject = config.modResults;
        const target = xcodeProject.getFirstTarget().uuid;

        const stripCodeScript = `set -e
if which bitcode_strip >/dev/null; then
  echo "🔨  Stripping bitcode from embedded frameworks"
  DIR="\${TARGET_BUILD_DIR}/\${FRAMEWORKS_FOLDER_PATH}"
  [ -d "$DIR" ] || exit 0
  for BIN in "$DIR"/*.framework/* ; do
    bitcode_strip "$BIN" -r -o "$BIN" 2>/dev/null || true
  done
fi`;

        // Check if the Strip Code build phase already exists
        const existingPhases = xcodeProject.buildPhaseObject('PBXShellScriptBuildPhase');
        const stripCodeExists = Object.values(existingPhases || {}).some(
            phase => phase.name === '"Strip Code"'
        );

        if (!stripCodeExists) {
            // Find the "[CP] Embed Pods Frameworks" build phase
            const embedPodsPhase = Object.values(existingPhases || {}).find(
                phase => phase.name === '"[CP] Embed Pods Frameworks"'
            );

            // Add the Strip Code build phase
            const stripCodePhase = xcodeProject.addBuildPhase(
                [],
                'PBXShellScriptBuildPhase',
                'Strip Code',
                target,
                {
                    shellScript: stripCodeScript,
                    shellPath: '/bin/sh'
                }
            );

            if (embedPodsPhase && stripCodePhase) {
                // Move the Strip Code phase to be right after Embed Pods Frameworks
                const targetObject = xcodeProject.getTarget(target);
                const buildPhases = targetObject.buildPhases;

                const embedPodsIndex = buildPhases.findIndex(
                    phase => phase.comment === '[CP] Embed Pods Frameworks'
                );

                if (embedPodsIndex !== -1) {
                    // Remove Strip Code from its current position
                    const stripCodeIndex = buildPhases.findIndex(
                        phase => phase.comment === 'Strip Code'
                    );

                    if (stripCodeIndex !== -1) {
                        const stripCodeRef = buildPhases.splice(stripCodeIndex, 1)[0];
                        // Insert it right after Embed Pods Frameworks
                        buildPhases.splice(embedPodsIndex + 1, 0, stripCodeRef);
                    }
                }
            }
        }

        return config;
    });
};
