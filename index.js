import { extension_settings } from '../../../extensions.js';

const extensionName = 'OmniMemory';
const extensionFolderPath = `scripts/extensions/${extensionName}`;
const defaultSettings = { apiUrl: 'https://api.openai.com/v1/chat/completions', apiKey: '', apiModel: '' };
let settings = Object.assign({}, defaultSettings, extension_settings[extensionName]);

/**
 * 新增功能：自动从 API 网址拉取支持的模型列表
 */
async function fetchModelsAuto() {
    const urlInput = $('#omni-api-url').val().trim();
    const keyInput = $('#omni-api-key').val().trim();
    
    if (!urlInput) {
        toastr.warning('请先填写 API URL');
        return;
    }

    // OpenAI 格式的获取模型接口通常是把 /chat/completions 替换为 /models
    const modelsUrl = urlInput.replace('/chat/completions', '/models');
    
    try {
        $('#omni-btn-fetch-models').text('获取中...');
        const response = await fetch(modelsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${keyInput}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`状态码: ${response.status}`);
        
        const data = await response.json();
        const models = data.data; // OpenAI标准格式返回 { data: [ {id: "gpt-4", ...} ] }
        
        // 更新下拉框
        const modelSelect = $('#omni-api-model');
        modelSelect.empty();
        
        if (models && models.length > 0) {
            models.forEach(m => {
                modelSelect.append(`<option value="${m.id}">${m.id}</option>`);
            });
            toastr.success(`成功获取 ${models.length} 个模型！`);
            
            // 如果之前有保存过的模型，自动选中它
            if (settings.apiModel) {
                modelSelect.val(settings.apiModel);
            }
        } else {
            toastr.warning('未能获取到模型列表。');
        }
    } catch (error) {
        console.error(`[${extensionName}] 获取模型失败:`, error);
        toastr.error('获取模型失败，请检查 URL 或 Key 是否正确。');
    } finally {
        $('#omni-btn-fetch-models').text('🔄 自动获取');
    }
}

// 初始化插件 UI 和逻辑
jQuery(async () => {
    const html = await $.get(`${extensionFolderPath}/index.html`);
    $("#extensions_settings").append(html);
    $('head').append(`<link rel="stylesheet" href="${extensionFolderPath}/style.css">`);

    // 填入已有设置
    $('#omni-api-url').val(settings.apiUrl);
    $('#omni-api-key').val(settings.apiKey);
    
    // 初始化下拉框（如果有历史记录，先强行放进去，等用户点获取再刷新）
    if (settings.apiModel) {
        $('#omni-api-model').html(`<option value="${settings.apiModel}">${settings.apiModel}</option>`);
    }

    // 绑定事件：获取模型
    $('#omni-btn-fetch-models').on('click', fetchModelsAuto);

    // 绑定事件：保存设置
    $('#omni-btn-save').on('click', () => {
        settings.apiUrl = $('#omni-api-url').val();
        settings.apiKey = $('#omni-api-key').val();
        settings.apiModel = $('#omni-api-model').val();
        
        extension_settings[extensionName] = settings;
        console.log(`[${extensionName}] 设置已保存:`, settings);
        toastr.success('OmniMemory 设置已保存');
    });

    console.log(`[${extensionName}] 插件已加载！`);
});
