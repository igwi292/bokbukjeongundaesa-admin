plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

val middleSpaceDebugApiBaseUrl = providers.gradleProperty("MIDDLESPACE_API_BASE_URL")
    .orElse("http://10.0.2.2:8000/api")
val middleSpaceReleaseApiBaseUrl = providers.gradleProperty("MIDDLESPACE_RELEASE_API_BASE_URL")
    .orElse("https://bokbuk.app/api")

android {
    namespace = "com.example.middlespace.admin"
    compileSdk { version = release(37) }

    defaultConfig {
        applicationId = "com.example.middlespace.admin"
        minSdk = 24
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"
        manifestPlaceholders["usesCleartextTraffic"] = "false"
    }

    buildTypes {
        debug {
            buildConfigField("String", "API_BASE_URL", "\"${middleSpaceDebugApiBaseUrl.get()}\"")
            manifestPlaceholders["usesCleartextTraffic"] = "true"
        }
        release {
            buildConfigField("String", "API_BASE_URL", "\"${middleSpaceReleaseApiBaseUrl.get()}\"")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.kotlinx.coroutines.android)
    testImplementation(libs.junit)
    debugImplementation(libs.androidx.compose.ui.tooling)
}
