# Cast Receiver Setup

Bitmovin Player Android & iOS SDKs v2.x build upon the v7 Web Player API, thus requiring cast receiver applications to use the Bitmovin Player v7 for those sender applications.

## Basic Instructions

1. Register your receiver app at https://cast.google.com/publish
2. Add your player license key in the sender's and receiver's player config
3. Make sure to whitelist the domain where the receiver app is hosted at https://bitmovin.com/dashboard
4. Change the application ID in the sender's remotecontrol config to your own
