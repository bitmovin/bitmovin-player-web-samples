# Bitmovin Player MultiView Samples

This folder contains a few samples showcasing how you could achieve a multiview experience using Bitmovin Player Web SDK.

### Multi-Player approach
The [multiplayer sample](multiplayer.html) shows how you can leverage multiple Bitmovin Player instances to achieve multiview.
In the sample, one player is always kept predominant but additional players can be added to the multiview. As many as 4 sources can be added and played simultaneously. Players can also be swapped around, e.g. you can drag one of the active player to become the main one, etc.
This approach could be a viable solution for all browsers that support multiple player instances (i.e. desktop browsers).
