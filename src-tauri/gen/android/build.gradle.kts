buildscript {
    repositories {
        google()
        // Canonical Maven Central host — repo.maven.apache.org doesn't
        // resolve on every network, repo1.maven.org always does.
        maven(url = "https://repo1.maven.org/maven2")
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.11.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25")
    }
}

allprojects {
    repositories {
        google()
        maven(url = "https://repo1.maven.org/maven2")
        mavenCentral()
    }
}

tasks.register("clean").configure {
    delete("build")
}

