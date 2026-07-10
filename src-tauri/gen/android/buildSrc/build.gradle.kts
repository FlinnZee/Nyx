plugins {
    `kotlin-dsl`
}

gradlePlugin {
    plugins {
        create("pluginsForCoolKids") {
            id = "rust"
            implementationClass = "RustPlugin"
        }
    }
}

repositories {
    google()
    // Canonical Maven Central host — repo.maven.apache.org doesn't resolve
    // on every network, repo1.maven.org always does.
    maven(url = "https://repo1.maven.org/maven2")
    mavenCentral()
}

dependencies {
    compileOnly(gradleApi())
    implementation("com.android.tools.build:gradle:8.11.0")
}

