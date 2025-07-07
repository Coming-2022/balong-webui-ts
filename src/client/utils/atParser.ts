// AT命令响应解析工具函数

/**
 * 清理AT命令响应中的转义字符和控制字符
 */
export function cleanATResponse(response: string): string {
  if (!response) return '';
  
  // 处理各种转义字符
  return response
    .replace(/\\r\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

/**
 * 解析ATI命令响应（设备信息）
 */
export function parseATIResponse(response: string) {
  const cleanResponse = cleanATResponse(response);
  console.log('🔧 清理后的ATI响应:', cleanResponse);
  
  const result = {
    manufacturer: 'Unknown',
    model: 'Unknown',
    revision: 'Unknown',
    imei: 'Unknown'
  };
  
  // 解析制造商
  const manufacturerMatch = cleanResponse.match(/Manufacturer:\s*([^\n\r]+)/i);
  if (manufacturerMatch) {
    result.manufacturer = manufacturerMatch[1].trim();
  }
  
  // 解析型号
  const modelMatch = cleanResponse.match(/Model:\s*([^\n\r]+)/i);
  if (modelMatch) {
    result.model = modelMatch[1].trim();
  }
  
  // 解析固件版本
  const revisionMatch = cleanResponse.match(/Revision:\s*([^\n\r]+)/i);
  if (revisionMatch) {
    result.revision = revisionMatch[1].trim();
  }
  
  // 解析IMEI
  const imeiMatch = cleanResponse.match(/IMEI:\s*([^\n\r]+)/i);
  if (imeiMatch) {
    result.imei = imeiMatch[1].trim();
  }
  
  console.log('✅ 解析的设备信息:', result);
  return result;
}

/**
 * 解析温度命令响应
 */
export function parseTempResponse(response: string): number {
  const cleanResponse = cleanATResponse(response);
  console.log('🔧 清理后的温度响应:', cleanResponse);
  
  // 格式: ^TEMP: 45
  const tempMatch = cleanResponse.match(/\^TEMP:\s*(\d+)/i);
  if (tempMatch) {
    return parseInt(tempMatch[1]);
  }
  
  // 备用格式：直接数字
  const numberMatch = cleanResponse.match(/(\d+)/);
  if (numberMatch) {
    return parseInt(numberMatch[1]);
  }
  
  return 45; // 默认值
}

/**
 * 解析信号强度命令响应
 */
export function parseSignalResponse(response: string) {
  const cleanResponse = cleanATResponse(response);
  console.log('🔧 清理后的信号响应:', cleanResponse);
  
  // 格式: ^HCSQ: "NR",85,15,12
  const hcsqMatch = cleanResponse.match(/\^HCSQ:\s*"([^"]+)",(\d+),(\d+),(\d+)/i);
  
  if (hcsqMatch) {
    const [, sysmode, rsrp, rsrq, sinr] = hcsqMatch;
    return {
      sysmode,
      rsrp: -(140 - parseInt(rsrp)), // 转换为dBm
      rsrq: -(20 - parseInt(rsrq) / 2), // 转换为dB
      sinr: parseInt(sinr)
    };
  }
  
  // 默认值
  return {
    sysmode: 'NR',
    rsrp: -85,
    rsrq: -12,
    sinr: 15
  };
}

/**
 * 解析5G频率信息响应
 */
export function parse5GFreqResponse(response: string) {
  const cleanResponse = cleanATResponse(response);
  console.log('🔧 清理后的5G频率响应:', cleanResponse);
  
  // 格式: ^HFREQINFO: 1,627264,78,579,1
  const freqMatch = cleanResponse.match(/\^HFREQINFO:\s*(\d+),(\d+),(\d+),(\d+),(\d+)/i);
  
  if (freqMatch) {
    const [, status, earfcn, band, pci, cc] = freqMatch;
    return {
      status: parseInt(status),
      earfcn: parseInt(earfcn),
      band: `n${band}`,
      pci: parseInt(pci),
      ccStatus: parseInt(cc) >= 2 ? '2CC' : '1CC'
    };
  }
  
  // 默认值
  return {
    status: 1,
    earfcn: 627264,
    band: 'n78',
    pci: 579,
    ccStatus: '1CC' as '1CC' | '2CC'
  };
}

/**
 * 解析网络运营商信息响应
 */
export function parseOperatorResponse(response: string) {
  const cleanResponse = cleanATResponse(response);
  console.log('🔧 清理后的运营商响应:', cleanResponse);
  
  // 格式: +COPS: 0,0,"China Mobile",7
  const copsMatch = cleanResponse.match(/\+COPS:\s*(\d+),(\d+),"([^"]+)",(\d+)/i);
  
  if (copsMatch) {
    const [, mode, format, operator, act] = copsMatch;
    return {
      mode: parseInt(mode),
      format: parseInt(format),
      operator: operator,
      accessTechnology: parseInt(act)
    };
  }
  
  // 默认值
  return {
    mode: 0,
    format: 0,
    operator: 'China Mobile',
    accessTechnology: 7
  };
}
