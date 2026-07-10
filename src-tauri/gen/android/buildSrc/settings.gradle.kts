// Route plugin resolution through hosts that resolve on every network —
// the default portal proxies to repo.maven.apache.org, which some DNS
// providers fail to resolve.
pluginManagement {
    repositories {
        maven(url = "https://repo1.maven.org/maven2")
        gradlePluginPortal()
        google()
    }
}
