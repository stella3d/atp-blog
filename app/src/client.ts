import { XRPC, CredentialManager } from '@atcute/client';

// TODO - make service url configurable
const manager = new CredentialManager({ service: 'https://bsky.social' });
export const AT_RPC = new XRPC({ handler: manager });


/*
{
    "uri": "at://did:plc:7mnpet2pvof2llhpcwattscf/beauty.piss.blog.index/3lljxymbgil2r",
    "cid": "bafyreia7vnple5dza6oywe7w7q7p4sci7fun7h76fzq2zakfiora6vvc3m",
    "value": {
        "$type": "beauty.piss.blog.index",
        "posts": [
            {
                "post": {
                    "cid": "bafyreif3afke37uyykpui7z37yld4efvaw5kdxt6az7opcfrbj2ubvtipa",
                    "uri": "at://did:plc:7mnpet2pvof2llhpcwattscf/beauty.piss.blog.entry/3lljr3jdcjc26"
                },
                "tags": [
                    "rust",
                    "test"
                ],
                "title": "TEST POST",
                "createdAt": "2025-03-29T16:28:55.502Z"
            }
        ]
    }
}
*/
type GetIndexResponse = {
    uri: string; // URI of the record
    cid: string; // Content Identifier
    value: {
        $type: string; // Type of the record
        posts: Array<{
            post: {
                cid: string; // Content Identifier of the post
                uri: string; // URI for accessing the post
            };
            tags?: Array<string>; // Optional tags
            title: string; // Title of the post
            createdAt: string; // ISO date string
        }>;
    };
};

function isGetIndexResponse(data: any): data is GetIndexResponse {
    return (
        data &&
        typeof data === 'object' &&
        'uri' in data &&
        'cid' in data &&
        'value' in data &&
        typeof data.value === 'object' &&
        Array.isArray(data.value.posts)
    );
}


export async function getBlogIndex(repo: string, rkey: string): Promise<GetIndexResponse> {
    const cacheKey = `blogIndex-${repo}-${rkey}`;
    const cachedResult = localStorage.getItem(cacheKey);

    if (cachedResult) {
        try {
            const { expiration, data } = JSON.parse(cachedResult);
            if (Date.now() < expiration) {
                if (!isGetIndexResponse(data)) {
                    // If the cached data does not match the expected type, fetch fresh data
                    console.warn('Cached data does not match expected type, fetching fresh data');
                } 
                // If cached data is valid, return it
                console.log('Returning valid cached data');
                console.log(data);
                return data; // Return the cached data if it's valid
            }
        } catch {
            // Ignore JSON errors and fetch fresh data
        }
    }

    // Fetch data from server
    const { data } = await AT_RPC.get('com.atproto.repo.getRecord', {
        params: {
            repo, // Replace with actual repo DID
            collection: 'beauty.piss.blog.index', // Collection name
            rkey, // Record key, empty for the entire collection
        },
    });

    console.log('fetched data from server:', data);
    // Cache the data for 15 minutes (900000 milliseconds)
    const expiration = Date.now() + 900000;
    localStorage.setItem(cacheKey, JSON.stringify({ expiration, data }));

    if (!isGetIndexResponse(data)) {
        throw new Error('fetched data does not match expected type for GetIndexResponse');
    }
    return data;
}