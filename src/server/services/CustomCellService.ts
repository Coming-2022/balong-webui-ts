import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import type { CustomCellConfig, CustomCellConfigRequest, CellLockOption } from '../../types';

export class CustomCellService {
  private configPath: string;
  private presetConfigPath: string;
  private customConfigs: CustomCellConfig[] = [];
  private presetConfigs: CustomCellConfig[] = [];

  constructor() {
    this.configPath = path.join(process.cwd(), 'data', 'custom-cells.json');
    this.presetConfigPath = path.join(process.cwd(), 'data', 'preset-cells.json');
    this.ensureDataDirectory();
    this.loadConfigs();
  }

  private async ensureDataDirectory(): Promise<void> {
    const dataDir = path.dirname(this.configPath);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  private async loadConfigs(): Promise<void> {
    // 加载自定义配置
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      this.customConfigs = JSON.parse(data);
      logger.info(`✅ 自定义小区配置加载成功，共 ${this.customConfigs.length} 个配置`);
    } catch (error) {
      logger.info('📝 自定义小区配置文件不存在，将创建新文件');
      this.customConfigs = [];
      await this.saveCustomConfigs();
    }

    // 加载预设配置
    try {
      const data = await fs.readFile(this.presetConfigPath, 'utf8');
      this.presetConfigs = JSON.parse(data);
      logger.info(`✅ 预设小区配置加载成功，共 ${this.presetConfigs.length} 个配置`);
    } catch (error) {
      logger.info('📝 预设小区配置文件不存在，将创建默认配置');
      await this.initializePresetConfigs();
    }
  }

  private async initializePresetConfigs(): Promise<void> {
    // 创建默认预设配置
    this.presetConfigs = [
      {
        id: 'preset_cell_16',
        name: 'Cell 16 (ARFCN 627264)',
        band: '78',
        arfcn: '627264',
        pci: '16',
        type: '1CC',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'preset_cell_579_627264',
        name: 'Cell 579 (ARFCN 627264)',
        band: '78',
        arfcn: '627264',
        pci: '579',
        type: '2CC',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'preset_cell_334_627264',
        name: 'Cell 334 (ARFCN 627264)',
        band: '78',
        arfcn: '627264',
        pci: '334',
        type: '2CC',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'preset_cell_334_633984',
        name: 'Cell 334 (ARFCN 633984)',
        band: '78',
        arfcn: '633984',
        pci: '334',
        type: '2CC',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    await this.savePresetConfigs();
    logger.info('🔧 默认预设配置已创建');
  }

  private async saveCustomConfigs(): Promise<void> {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.customConfigs, null, 2));
      logger.info('💾 自定义小区配置已保存');
    } catch (error) {
      logger.error('保存自定义小区配置失败', error);
      throw error;
    }
  }

  private async savePresetConfigs(): Promise<void> {
    try {
      await fs.writeFile(this.presetConfigPath, JSON.stringify(this.presetConfigs, null, 2));
      logger.info('💾 预设小区配置已保存');
    } catch (error) {
      logger.error('保存预设小区配置失败', error);
      throw error;
    }
  }

  /**
   * 获取所有配置（预设 + 自定义）
   */
  public getAllConfigs(): CustomCellConfig[] {
    return [...this.presetConfigs, ...this.customConfigs];
  }

  /**
   * 获取所有自定义配置
   */
  public getCustomConfigs(): CustomCellConfig[] {
    return [...this.customConfigs];
  }

  /**
   * 获取所有预设配置
   */
  public getPresetConfigs(): CustomCellConfig[] {
    return [...this.presetConfigs];
  }

  /**
   * 根据ID获取配置
   */
  public getConfigById(id: string): { config: CustomCellConfig; isPreset: boolean } | null {
    // 先在预设中查找
    const presetConfig = this.presetConfigs.find(config => config.id === id);
    if (presetConfig) {
      return { config: presetConfig, isPreset: true };
    }

    // 再在自定义中查找
    const customConfig = this.customConfigs.find(config => config.id === id);
    if (customConfig) {
      return { config: customConfig, isPreset: false };
    }

    return null;
  }

  /**
   * 添加新的配置
   */
  public async addConfig(request: CustomCellConfigRequest, isPreset: boolean = false): Promise<CustomCellConfig> {
    // 验证输入
    this.validateConfigRequest(request);

    // 检查名称是否重复
    const allConfigs = this.getAllConfigs();
    if (allConfigs.some(config => config.name === request.name)) {
      throw new Error('配置名称已存在');
    }

    const newConfig: CustomCellConfig = {
      id: isPreset ? `preset_${uuidv4()}` : uuidv4(),
      ...request,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isPreset) {
      this.presetConfigs.push(newConfig);
      await this.savePresetConfigs();
      logger.info(`➕ 添加预设小区配置: ${newConfig.name}`);
    } else {
      this.customConfigs.push(newConfig);
      await this.saveCustomConfigs();
      logger.info(`➕ 添加自定义小区配置: ${newConfig.name}`);
    }

    return newConfig;
  }

  /**
   * 更新配置
   */
  public async updateConfig(id: string, request: CustomCellConfigRequest): Promise<CustomCellConfig> {
    const result = this.getConfigById(id);
    if (!result) {
      throw new Error('配置不存在');
    }

    const { config, isPreset } = result;

    // 验证输入
    this.validateConfigRequest(request);

    // 检查名称是否重复（排除自己）
    const allConfigs = this.getAllConfigs();
    if (allConfigs.some(c => c.id !== id && c.name === request.name)) {
      throw new Error('配置名称已存在');
    }

    const updatedConfig: CustomCellConfig = {
      ...config,
      ...request,
      updatedAt: new Date().toISOString()
    };

    if (isPreset) {
      const index = this.presetConfigs.findIndex(c => c.id === id);
      this.presetConfigs[index] = updatedConfig;
      await this.savePresetConfigs();
      logger.info(`✏️ 更新预设小区配置: ${updatedConfig.name}`);
    } else {
      const index = this.customConfigs.findIndex(c => c.id === id);
      this.customConfigs[index] = updatedConfig;
      await this.saveCustomConfigs();
      logger.info(`✏️ 更新自定义小区配置: ${updatedConfig.name}`);
    }

    return updatedConfig;
  }

  /**
   * 删除配置
   */
  public async deleteConfig(id: string): Promise<void> {
    const result = this.getConfigById(id);
    if (!result) {
      throw new Error('配置不存在');
    }

    const { config, isPreset } = result;

    if (isPreset) {
      const index = this.presetConfigs.findIndex(c => c.id === id);
      this.presetConfigs.splice(index, 1);
      await this.savePresetConfigs();
      logger.info(`🗑️ 删除预设小区配置: ${config.name}`);
    } else {
      const index = this.customConfigs.findIndex(c => c.id === id);
      this.customConfigs.splice(index, 1);
      await this.saveCustomConfigs();
      logger.info(`🗑️ 删除自定义小区配置: ${config.name}`);
    }
  }

  /**
   * 生成AT命令
   */
  public generateATCommand(config: CustomCellConfig): string {
    return `AT^NRFREQLOCK=2,0,1,"${config.band}","${config.arfcn}","1","${config.pci}"`;
  }

  /**
   * 获取所有小区锁定选项（预设 + 自定义）
   */
  public getAllCellLockOptions(): CellLockOption[] {
    // 预设选项
    const presetOptions: CellLockOption[] = this.presetConfigs.map(config => ({
      id: config.id,
      name: config.name,
      type: config.type,
      isCustom: false,
      isPreset: true,
      band: config.band,
      arfcn: config.arfcn,
      pci: config.pci
    }));

    // 自定义选项
    const customOptions: CellLockOption[] = this.customConfigs.map(config => ({
      id: config.id,
      name: config.name,
      type: config.type,
      isCustom: true,
      isPreset: false,
      band: config.band,
      arfcn: config.arfcn,
      pci: config.pci
    }));

    return [...presetOptions, ...customOptions];
  }

  /**
   * 验证配置请求
   */
  private validateConfigRequest(request: CustomCellConfigRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('配置名称不能为空');
    }

    if (!request.band || request.band.trim().length === 0) {
      throw new Error('频段不能为空');
    }

    if (!request.arfcn || request.arfcn.trim().length === 0) {
      throw new Error('ARFCN不能为空');
    }

    if (!request.pci || request.pci.trim().length === 0) {
      throw new Error('PCI不能为空');
    }

    if (!['1CC', '2CC'].includes(request.type)) {
      throw new Error('类型必须是1CC或2CC');
    }

    // 验证数字格式
    if (!/^\d+$/.test(request.band)) {
      throw new Error('频段必须是数字');
    }

    if (!/^\d+$/.test(request.arfcn)) {
      throw new Error('ARFCN必须是数字');
    }

    if (!/^\d+$/.test(request.pci)) {
      throw new Error('PCI必须是数字');
    }

    // 验证范围
    const bandNum = parseInt(request.band);
    const arfcnNum = parseInt(request.arfcn);
    const pciNum = parseInt(request.pci);

    if (bandNum < 1 || bandNum > 255) {
      throw new Error('频段范围应在1-255之间');
    }

    if (arfcnNum < 0 || arfcnNum > 3279165) {
      throw new Error('ARFCN范围应在0-3279165之间');
    }

    if (pciNum < 0 || pciNum > 1007) {
      throw new Error('PCI范围应在0-1007之间');
    }
  }
}
