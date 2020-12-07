## Bitmovin Advertising Module (BAM) Sample

This folder contains BAM-specific samples.
Per default, the Bitmovin Player uses the Google IMA SDK for ad handling. As an alternative, there is the Bitmovin Advertising Module, which does not use third party SDKs from ad providers.

Some limitations of the different ad modules:
- IMA and BAM cannot be used in the same player instance, or even the same page as modules are added globally to the Player classes.
- BAM should not be used if Google DFP is used as ad server as not all features are possible without the IMA SDK.
- With IMA, no UI should be rendered as IMA or the ads _may_ provide UI elements. When playing linear ads with BAM, the "ad variant" of the player's default [UI](https://github.com/bitmovin/bitmovin-player-ui) is used.
