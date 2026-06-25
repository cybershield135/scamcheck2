const URL_PATTERN =
    /(?:https?:\/\/(?:www\.)?|www\.)[a-zA-Z0-9][-a-zA-Z0-9@:%._+~#=]{0,256}\.[a-zA-Z]{2,}(?:\/[-a-zA-Z0-9@:%_+.~#?&/=]*)?|(?:bit\.ly|tinyurl\.com|goo\.gl|t\.co|ow\.ly|is\.gd|buff\.ly|rb\.gy|shorturl\.at|rebrand\.ly|cutt\.ly|s\.id)\/[a-zA-Z0-9_-]+/gi;

let legitimateDomainsCache = null;

export async function loadLegitimateDomains() {
    if (legitimateDomainsCache) return legitimateDomainsCache;
    const response = await fetch("/data/legitimate-domains.json");
    legitimateDomainsCache = await response.json();
    return legitimateDomainsCache;
}

export function extractUrls(text) {
    if (!text) return [];
    const matches = text.match(URL_PATTERN) || [];
    return [...new Set(matches.map(normalizeUrl))];
}

function normalizeUrl(url) {
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized) && !/^www\./i.test(normalized)) {
        if (/^[a-z]+\.[a-z]/i.test(normalized)) {
            normalized = `https://${normalized}`;
        }
    } else if (/^www\./i.test(normalized)) {
        normalized = `https://${normalized}`;
    }
    return normalized;
}

function getHostname(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
        return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
    }
}

function levenshtein(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] =
                b[i - 1] === a[j - 1]
                    ? matrix[i - 1][j - 1]
                    : Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1;
        }
    }
    return matrix[b.length][a.length];
}

function looksLikeTyposquat(hostname, legitDomain) {
    const hostBase = hostname.replace(/\.(com|vn|net|org|io)(\.vn)?$/i, "").replace(/\./g, "");
    const legitBase = legitDomain.replace(/\.(com|vn|net|org|io)(\.vn)?$/i, "").replace(/\./g, "");

    if (hostBase === legitBase) return false;
    if (hostname.includes(legitBase) && hostname !== legitDomain) return true;

    const distance = levenshtein(hostBase, legitBase);
    return distance > 0 && distance <= 2 && hostBase.length >= 5;
}

export async function analyzeLinksInText(text) {
    const urls = extractUrls(text);
    const legitimateList = await loadLegitimateDomains();
    const results = [];

    for (const url of urls) {
        const hostname = getHostname(url);
        let status = "An toàn";
        let reason = "Không phát hiện dấu hiệu giả mạo tên miền phổ biến.";
        let spoofTarget = null;

        for (const entry of legitimateList) {
            for (const legitDomain of entry.domains) {
                if (hostname === legitDomain || hostname.endsWith(`.${legitDomain}`)) {
                    status = "An toàn";
                    reason = `Tên miền khớp ${entry.org} chính thống.`;
                    spoofTarget = entry.org;
                    break;
                }
                if (looksLikeTyposquat(hostname, legitDomain)) {
                    status = "Nguy hiểm";
                    reason = `Tên miền "${hostname}" có thể giả mạo ${entry.org} (${legitDomain}).`;
                    spoofTarget = entry.org;
                    break;
                }
            }
            if (status === "Nguy hiểm") break;
        }

        if (!spoofTarget && /(login|verify|secure|xacminh|bank|otp)/i.test(hostname)) {
            status = "Nghi ngờ";
            reason = "Tên miền chứa từ khóa nhạy cảm (login, verify, xacminh...) — cần thận trọng.";
        }

        results.push({ url, hostname, status, reason });
    }

    return results;
}

export async function analyzeSingleLink(url) {
    const links = await analyzeLinksInText(url);
    if (links.length === 0) {
        const hostname = getHostname(url);
        return {
            url,
            status: "Nghi ngờ",
            riskScore: 50,
            analysis: `Không phân tích được tên miền "${hostname}". Hãy thận trọng trước khi bấm.`,
            recommendation: "Không bấm link nếu không chắc chắn nguồn gốc. Hỏi người thân hoặc gọi tổng đài chính thức."
        };
    }

    const item = links[0];
    const riskScore = item.status === "Nguy hiểm" ? 90 : item.status === "Nghi ngờ" ? 60 : 15;

    return {
        url: item.url,
        status: item.status,
        riskScore,
        analysis: item.reason,
        recommendation:
            item.status === "Nguy hiểm"
                ? "KHÔNG bấm link này. Xóa tin nhắn và chặn số gửi."
                : item.status === "Nghi ngờ"
                  ? "Không bấm link. Kiểm tra lại trên website chính thức của tổ chức."
                  : "Vẫn nên cẩn trọng — chỉ truy cập qua app hoặc website chính thức."
    };
}
