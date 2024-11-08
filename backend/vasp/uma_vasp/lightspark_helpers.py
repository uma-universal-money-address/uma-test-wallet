from lightspark import LightsparkSyncClient, LightsparkNode


def get_node(lightspark_client: LightsparkSyncClient, node_id: str) -> LightsparkNode:
    node = lightspark_client.get_entity(node_id, LightsparkNode)
    if not node:
        raise Exception(f"Cannot find node {node_id}")
    return node
