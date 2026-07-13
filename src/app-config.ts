// Bundled into the generated index.html from this TypeScript source.
        const DB_NAME = 'GeminiPWA_DB';
        const DB_VERSION = 8;
        const SETTINGS_STORE = 'settings';
        const CHATS_STORE = 'chats';
        const CHAT_UPDATEDAT_INDEX = 'updatedAtIndex';
        const CHAT_CREATEDAT_INDEX = 'createdAtIndex';
        const API_PROVIDERS = [
            { value: 'gemini', text: 'Gemini (Google)' },
            { value: 'deepseek', text: 'DeepSeek' },
            { value: 'claude', text: 'Claude (Anthropic API)' },
            { value: 'openai', text: 'ChatGPT (OpenAI API)' },
            { value: 'xai', text: 'Grok (xAI API)' },
            { value: 'llmaggregator', text: 'LLM Aggregator' }
        ];
        const DEFAULT_MODEL = 'gemini-3.5-flash';
        const DEFAULT_DEEPSEEK_MODEL = 'deepseek-reasoner';
        const DEFAULT_CLAUDE_MODEL = 'claude-3-7-sonnet-20250219';
        const DEFAULT_OPENAI_MODEL = 'gpt-3.5-turbo';
        const DEFAULT_XAI_MODEL = 'grok-4-1-fast-non-reasoning';
        const DEFAULT_LLMAGGREGATOR_MODEL = 'google/gemma-4-31b-it:free';
        const DEFAULT_STREAMING_SPEED = 12;
        const DEFAULT_TEMPERATURE = 0.5;
        const DEFAULT_MAX_TOKENS = 4000;
        const DEFAULT_TOP_K = 40;
        const DEFAULT_TOP_P = 0.95;
        const DEFAULT_CLAUDE_TEMPERATURE = 0.7;
        const DEFAULT_CLAUDE_MAX_TOKENS = 4096;
        const DEFAULT_CLAUDE_TOP_P = 1.0;
        const DEFAULT_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        const DEFAULT_MESSAGE_BODY_FONT_SIZE = 14;
        const DEFAULT_CODE_BLOCK_FONT_SIZE = 13;
        const DEFAULT_MEMO_HEIGHT = '300px';
        const DEFAULT_CLIPBOARD_STACK_HEIGHT = '300px';
        const DEFAULT_MESSAGE_ICON_SIZE = 28;
        const DEFAULT_MESSAGE_ICON_OFFSET_Y = -10;
        const DEFAULT_USER_NAME = "あなた";
        const DEFAULT_AI_NAME = "AI";
        const DEFAULT_ICON_NAME_FONT_SIZE = 10;
        const DEFAULT_ICON_NAME_OFFSET_Y = -10;
        const DEFAULT_USER_NAME_BUBBLE_COLOR = '#FFFFFF';
        const DEFAULT_USER_NAME_BUBBLE_OPACITY = 0.8;
        const DEFAULT_AI_NAME_BUBBLE_COLOR = '#FFFFFF';
        const DEFAULT_AI_NAME_BUBBLE_OPACITY = 0.8;
        const CHAT_TITLE_LENGTH = 15;
        const TEXTAREA_MAX_HEIGHT = 120;
        const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
        const DEEPSEEK_API_DEFAULT_BASE_URL = 'https://wild-star-4b72.chi87767.workers.dev/';
        const CLAUDE_API_BASE_URL = 'https://api.anthropic.com/v1/messages';
        const OPENAI_API_BASE_URL = 'https://api.openai.com/v1/chat/completions';
        const XAI_API_BASE_URL = 'https://api.x.ai/v1/chat/completions';
        const DUPLICATE_SUFFIX = ' (コピー)';
        const IMPORT_PREFIX = '(取込) ';

        const LIGHT_THEME_COLOR = '#4a90e2';
        const DARK_THEME_COLOR = '#007aff';
        const PASTEL_PINK_THEME_COLOR = '#ff8fab';
        const PASTEL_BLUE_THEME_COLOR = '#87cefa';
        const PASTEL_YELLOW_THEME_COLOR = '#ffd700';
        const PASTEL_PURPLE_THEME_COLOR = '#ab47bc';
const PASTEL_RAINBOW_THEME_COLOR = '#ffadad';
        const TURF_THEME_COLOR = '#4CAF50';

        const DARK_MODE_USER_MESSAGE_COLOR = '#056162';
        const DARK_MODE_MODEL_MESSAGE_COLOR = '#3a3a3c';
        const DARK_MODE_SECONDARY_COLOR = '#101010';
        const DARK_MODE_PRIMARY_COLOR = '#1a1a1a';

        const PASTEL_PINK_USER_MESSAGE_COLOR = '#ffddee';
        const PASTEL_PINK_MODEL_MESSAGE_COLOR = '#f3e8ff';
        const PASTEL_PINK_SECONDARY_COLOR = '#ffe6ea';
        const PASTEL_PINK_HEADER_COLOR = '#ff8fab';
        const PASTEL_PINK_PRIMARY_COLOR = '#fff5f8';

        const PASTEL_BLUE_USER_MESSAGE_COLOR = '#cff1ef';
        const PASTEL_BLUE_MODEL_MESSAGE_COLOR = '#e0e8ff';
        const PASTEL_BLUE_SECONDARY_COLOR = '#e0f0ff';
        const PASTEL_BLUE_HEADER_COLOR = '#87cefa';
        const PASTEL_BLUE_PRIMARY_COLOR = '#f0f8ff';

        const PASTEL_YELLOW_USER_MESSAGE_COLOR = '#fff5ba';
        const PASTEL_YELLOW_MODEL_MESSAGE_COLOR = '#ffe4b5';
        const PASTEL_YELLOW_SECONDARY_COLOR = '#fffacd';
        const PASTEL_YELLOW_HEADER_COLOR = '#ffd700';
        const PASTEL_YELLOW_PRIMARY_COLOR = '#fffefa';

        const PASTEL_PURPLE_USER_MESSAGE_COLOR = '#d1c4e9';
        const PASTEL_PURPLE_MODEL_MESSAGE_COLOR = '#c5cae9';
        const PASTEL_PURPLE_SECONDARY_COLOR = '#e1bee7';
        const PASTEL_PURPLE_HEADER_COLOR = '#ab47bc';
        const PASTEL_PURPLE_PRIMARY_COLOR = '#f3e5f5';

        const PASTEL_RAINBOW_USER_MESSAGE_COLOR = '#e0fff0';
        const PASTEL_RAINBOW_MODEL_MESSAGE_COLOR = '#e0f0ff';
        const PASTEL_RAINBOW_SECONDARY_COLOR = '#f0f0f0';
        const PASTEL_RAINBOW_HEADER_COLOR = '#ffadad';
        const PASTEL_RAINBOW_PRIMARY_COLOR = '#fdfdfd';

        const TURF_USER_MESSAGE_COLOR = '#ffffff';
        const TURF_MODEL_MESSAGE_COLOR = '#ffffff';
        const TURF_SECONDARY_COLOR = '#F6F4F9';
        const TURF_HEADER_COLOR = '#89d010';
        const TURF_PRIMARY_COLOR = '#F6F4F9';

        const LIGHT_MODE_USER_MESSAGE_COLOR = '#dcf8c6';
        const LIGHT_MODE_MODEL_MESSAGE_COLOR = '#e5e5ea';
        const LIGHT_MODE_SECONDARY_COLOR = '#f0f2f5';
        const LIGHT_MODE_HEADER_COLOR = '#4a90e2';
        const LIGHT_MODE_PRIMARY_COLOR = '#ffffff';

        const APP_VERSION = "0.26ti (627)";
        const SWIPE_THRESHOLD = 50;
        const ZOOM_THRESHOLD = 1.01;
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        const MAX_TOTAL_ATTACHMENT_SIZE = 50 * 1024 * 1024;
        const COLLAPSED_HEIGHT = 50;
        const DEFAULT_MESSAGE_BUBBLE_OPACITY = 0.9;
        const DEFAULT_MESSAGE_ACTIONS_BACKGROUND_OPACITY = 0.9;
        const DEFAULT_HEADER_FOOTER_OPACITY = 0.35;
        const DEFAULT_CHAT_OVERLAY_OPACITY = 0.7;
        const DEFAULT_TOGGLE_BUTTON_TOP_WIDTH = 6;
        const DEFAULT_TOGGLE_BUTTON_TOP_HEIGHT = 40;
        const DEFAULT_TOGGLE_BUTTON_TOP_FONT_SIZE = 12;
        const DEFAULT_TOGGLE_BUTTON_TOP_OPACITY = 0.6;
        const DEFAULT_TOGGLE_BUTTON_TOP_TEXT_COLLAPSE = "-";
        const DEFAULT_TOGGLE_BUTTON_TOP_TEXT_EXPAND = "◻︎";
        const DEFAULT_TOGGLE_BUTTON_BOTTOM_FONT_SIZE = 14;
        const DEFAULT_TOGGLE_BUTTON_BOTTOM_TEXT_COLLAPSE = "_";
        const DEFAULT_TOGGLE_BUTTON_BOTTOM_TEXT_EXPAND = "□";
        const DEFAULT_AUTO_SCROLL_ON_NEW_MESSAGE = true;
        const DEFAULT_PERSIST_MESSAGE_COLLAPSE_STATE = true;
        const DEFAULT_THOUGHT_SUMMARY_OPACITY = 0.65;
        const DEFAULT_THOUGHT_SUMMARY_FONT_SIZE = 13;

        const ALLOWED_LLMAGGREGATOR_DOMAINS = [
            'openrouter.ai',
            'vercel.com',
            'endpoints.anyscale.com',
            'together.ai',
            'console.groq.com',
            'fireworks.ai',
            'huggingface.co',
            'deepinfra.com'
        ];

        const extensionToMimeTypeMap = {
            'pdf': 'application/pdf', 'js': 'text/javascript', 'py': 'text/x-python',
            'txt': 'text/plain', 'html': 'text/html', 'htm': 'text/html', 'css': 'text/css',
            'md': 'text/md', 'csv': 'text/csv', 'xml': 'text/xml', 'rtf': 'text/rtf',
            'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp',
            'heic': 'image/heic', 'heif': 'image/heif',
            'mp4': 'video/mp4', 'mpeg': 'video/mpeg', 'mov': 'video/mov', 'avi': 'video/avi',
            'flv': 'video/x-flv', 'mpg': 'video/mpg', 'webm': 'video/webm', 'wmv': 'video/wmv',
            '3gp': 'video/3gpp', '3gpp': 'video/3gpp',
            'wav': 'audio/wav', 'mp3': 'audio/mp3', 'aiff': 'audio/aiff', 'aac': 'audio/aac',
            'ogg': 'audio/ogg', 'flac': 'audio/flac',
        };
