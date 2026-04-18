(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__0elryyx._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/node:events [external] (node:events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:events", () => require("node:events"));

module.exports = mod;
}),
"[externals]/node:assert [external] (node:assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:assert", () => require("node:assert"));

module.exports = mod;
}),
"[externals]/node:util [external] (node:util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:util", () => require("node:util"));

module.exports = mod;
}),
"[project]/ [middleware-edge] (unsupported edge import 'fs', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`fs`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'path', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`path`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'url', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`url`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'stream', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`stream`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'crypto', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`crypto`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'dns', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`dns`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'net', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`net`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'tls', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`tls`));
}),
"[project]/ [middleware-edge] (unsupported edge import 'string_decoder', ecmascript)", ((__turbopack_context__, module, exports) => {

__turbopack_context__.n(__import_unsupported(`string_decoder`));
}),
"[project]/dist/middleware/next.js [middleware-edge] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.nextRateLimit = nextRateLimit;
;
function nextRateLimit(req_1, bucket_1) {
    return __awaiter(this, arguments, void 0, function*(req, bucket, options = {}) {
        const reqAny = req;
        const key = options.keyGenerator ? yield options.keyGenerator(req) : reqAny.ip || req.headers.get('x-forwarded-for') || 'anonymous';
        const result = yield bucket.consume(key);
        // Set standard headers on the response
        const res = server_1.NextResponse.next();
        res.headers.set('X-RateLimit-Limit', bucket.options.capacity.toString());
        res.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        if (!result.allowed) {
            const limitedRes = server_1.NextResponse.json({
                error: 'Too Many Requests'
            }, {
                status: 429
            });
            limitedRes.headers.set('X-RateLimit-Limit', bucket.options.capacity.toString());
            limitedRes.headers.set('X-RateLimit-Remaining', result.remaining.toString());
            limitedRes.headers.set('Retry-After', Math.ceil(result.resetInMs / 1000).toString());
            return limitedRes;
        }
        return res;
    });
}
}),
"[project]/dist/types.js [middleware-edge] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
}),
"[project]/dist/TokenBucket.js [middleware-edge] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TokenBucket = void 0;
class TokenBucket {
    constructor(options){
        this.options = options;
        if (options.capacity <= 0) throw new Error('Capacity must be positive');
        if (options.refillAmount <= 0) throw new Error('Refill amount must be positive');
        if (options.refillIntervalMs <= 0) throw new Error('Refill interval must be positive');
    }
    consume(key_1) {
        return __awaiter(this, arguments, void 0, function*(key, amount = 1) {
            const fillRate = this.options.refillAmount / this.options.refillIntervalMs;
            try {
                return yield this.options.storage.consume(key, amount, this.options.capacity, fillRate);
            } catch (error) {
                if (this.options.failStrategy === 'FAIL_OPEN') {
                    console.warn('Rate limiter storage failed, failing open:', error);
                    return {
                        allowed: true,
                        remaining: 1,
                        resetInMs: 0
                    };
                }
                return {
                    allowed: false,
                    remaining: 0,
                    resetInMs: 0
                };
            }
        });
    }
}
exports.TokenBucket = TokenBucket;
}),
"[project]/dist/storage/StorageProvider.js [middleware-edge] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
}),
"[project]/dist/storage/RedisStorage.js [middleware-edge] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __awaiter = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RedisStorage = void 0;
const LUA_SCRIPT = `
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local fillRate = tonumber(ARGV[2])
  local amount = tonumber(ARGV[3])
  
  -- Get Redis server time
  local time = redis.call('TIME')
  local now = (tonumber(time[1]) * 1000) + math.floor(tonumber(time[2]) / 1000)

  local state = redis.call('HMGET', key, 'tokens', 'lastRefill')
  local lastTokens = tonumber(state[1]) or capacity
  local lastRefill = tonumber(state[2]) or now

  local elapsed = math.max(0, now - lastRefill)
  local refilled = elapsed * fillRate
  local currentTokens = math.min(capacity, lastTokens + refilled)

  local allowed = false
  if currentTokens >= amount then
    currentTokens = currentTokens - amount
    allowed = true
  end

  redis.call('HMSET', key, 'tokens', currentTokens, 'lastRefill', now)
  
  -- Key expires after it would be fully refilled (plus buffer)
  local ttl = math.ceil((capacity / fillRate) / 1000) + 60
  redis.call('EXPIRE', key, ttl)

  local resetInMs = math.ceil((capacity - currentTokens) / fillRate)
  
  return { allowed and 1 or 0, currentTokens, resetInMs }
`;
class RedisStorage {
    constructor(redis){
        this.redis = redis;
        this.redis.defineCommand('consumeTokenBucket', {
            numberOfKeys: 1,
            lua: LUA_SCRIPT
        });
    }
    consume(key, amount, capacity, fillRate) {
        return __awaiter(this, void 0, void 0, function*() {
            const [allowed, remaining, resetInMs] = yield this.redis.consumeTokenBucket(key, capacity, fillRate, amount);
            return {
                allowed: allowed === 1,
                remaining,
                resetInMs
            };
        });
    }
}
exports.RedisStorage = RedisStorage;
}),
"[project]/dist/middleware/types.js [middleware-edge] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
}),
"[project]/dist/index.js [middleware-edge] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __createBinding = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = {
            enumerable: true,
            get: function() {
                return m[k];
            }
        };
    }
    Object.defineProperty(o, k2, desc);
} : function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});
var __exportStar = /*TURBOPACK member replacement*/ __turbopack_context__.e && /*TURBOPACK member replacement*/ __turbopack_context__.e.__exportStar || function(m, exports1) {
    for(var p in m)if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports1, p)) __createBinding(exports1, m, p);
};
Object.defineProperty(exports, "__esModule", {
    value: true
});
__exportStar(__turbopack_context__.r("[project]/dist/types.js [middleware-edge] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/dist/TokenBucket.js [middleware-edge] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/dist/storage/StorageProvider.js [middleware-edge] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/dist/storage/RedisStorage.js [middleware-edge] (ecmascript)"), exports);
__exportStar(__turbopack_context__.r("[project]/dist/middleware/types.js [middleware-edge] (ecmascript)"), exports);
}),
"[project]/examples/nextjs/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$nextjs$2f$node_modules$2f$ioredis$2f$built$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/nextjs/node_modules/ioredis/built/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dist$2f$middleware$2f$next$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dist/middleware/next.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dist$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dist/index.js [middleware-edge] (ecmascript)");
;
;
;
/**
 * Singleton pattern for Redis and TokenBucket to ensure consistency
 * and efficient connection pooling in the Next.js Edge Runtime.
 */ const getRateLimiter = ()=>{
    const globalAny = globalThis;
    if (!globalAny._rateLimitBucket) {
        // 1. Initialize Redis client
        // In production, you would use an environment variable: process.env.REDIS_URL
        const redis = new __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$nextjs$2f$node_modules$2f$ioredis$2f$built$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["default"](process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null
        });
        // 2. Initialize storage and bucket
        const storage = new __TURBOPACK__imported__module__$5b$project$5d2f$dist$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["RedisStorage"](redis);
        globalAny._rateLimitBucket = new __TURBOPACK__imported__module__$5b$project$5d2f$dist$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["TokenBucket"]({
            capacity: 5,
            refillAmount: 1,
            refillIntervalMs: 2000,
            storage
        });
    }
    return globalAny._rateLimitBucket;
};
async function middleware(req) {
    // Only apply rate limiting to /api routes
    if (req.nextUrl.pathname.startsWith('/api')) {
        const bucket = getRateLimiter();
        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$dist$2f$middleware$2f$next$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["nextRateLimit"])(req, bucket);
        // Log for debugging visibility
        const remaining = res.headers.get('X-RateLimit-Remaining');
        console.log(`[RateLimit] ${req.nextUrl.pathname} | Remaining: ${remaining}`);
        return res;
    }
}
const config = {
    matcher: '/api/:path*'
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__0elryyx._.js.map