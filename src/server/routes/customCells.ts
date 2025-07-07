import { Router } from 'express';
import { CustomCellService } from '../services/CustomCellService';
import { ATClient } from '../services/ATClient';
import { logger } from '../utils/logger';
import type { APIResponse, CustomCellConfigRequest } from '../../types';

export function createCustomCellRoutes(customCellService: CustomCellService, atClient: ATClient): Router {
  const router = Router();

  // 获取所有自定义配置
  router.get('/configs', (req, res) => {
    try {
      const configs = customCellService.getCustomConfigs();
      res.json({
        success: true,
        data: configs,
        timestamp: new Date().toISOString()
      } as APIResponse);
    } catch (error) {
      logger.error('获取自定义小区配置失败', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  });

  // 获取所有预设配置
  router.get('/presets', (req, res) => {
    try {
      const configs = customCellService.getPresetConfigs();
      res.json({
        success: true,
        data: configs,
        timestamp: new Date().toISOString()
      } as APIResponse);
    } catch (error) {
      logger.error('获取预设小区配置失败', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  });

  // 获取所有配置（预设 + 自定义）
  router.get('/all', (req, res) => {
    try {
      const configs = customCellService.getAllConfigs();
      res.json({
        success: true,
        data: configs,
        timestamp: new Date().toISOString()
      } as APIResponse);
    } catch (error) {
      logger.error('获取所有小区配置失败', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  });

  // 获取所有小区锁定选项（预设 + 自定义）
  router.get('/options', (req, res) => {
    try {
      const options = customCellService.getAllCellLockOptions();
      res.json({
        success: true,
        data: options,
        timestamp: new Date().toISOString()
      } as APIResponse);
    } catch (error) {
      logger.error('获取小区锁定选项失败', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  });

  // 根据ID获取配置
  router.get('/configs/:id', (req, res) => {
    try {
      const result = customCellService.getConfigById(req.params.id);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: '配置不存在',
          timestamp: new Date().toISOString()
        } as APIResponse);
      }

      res.json({
        success: true,
        data: {
          ...result.config,
          isPreset: result.isPreset
        },
        timestamp: new Date().toISOString()
      } as APIResponse);
    } catch (error) {
      logger.error('获取小区配置失败', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  });

  // 添加新配置
  router.post('/configs', async (req, res) => {
    try {
      const request: CustomCellConfigRequest = req.body;
      const isPreset = req.body.isPreset === true;
      const newConfig = await customCellService.addConfig(request, isPreset);
      
      res.status(201).json({
        success: true,
        data: newConfig,
        message: `${isPreset ? '预设' : '自定义'}小区配置添加成功`,
        timestamp: new Date().toISOString()
      } as APIResponse);
    } catch (error) {
      logger.error('添加小区配置失败', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  });

  // 更新配置
  router.put('/configs/:id', async (req, res) => {
    try {
      const request: CustomCellConfigRequest = req.body;
      const updatedConfig = await customCellService.updateConfig(req.params.id, request);
      
      res.json({
        success: true,
        data: updatedConfig,
        message: '自定义小区配置更新成功',
        timestamp: new Date().toISOString()
      } as APIResponse);
    } catch (error) {
      logger.error('更新自定义小区配置失败', error);
      const status = error instanceof Error && error.message === '配置不存在' ? 404 : 400;
      res.status(status).json({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  });

  // 删除配置
  router.delete('/configs/:id', async (req, res) => {
    try {
      await customCellService.deleteConfig(req.params.id);
      
      res.json({
        success: true,
        message: '自定义小区配置删除成功',
        timestamp: new Date().toISOString()
      } as APIResponse);
    } catch (error) {
      logger.error('删除自定义小区配置失败', error);
      const status = error instanceof Error && error.message === '配置不存在' ? 404 : 400;
      res.status(status).json({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  });

  // 锁定小区
  router.post('/lock/:id', async (req, res) => {
    try {
      const result = customCellService.getConfigById(req.params.id);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: '配置不存在',
          timestamp: new Date().toISOString()
        } as APIResponse);
      }

      const { config } = result;
      const command = customCellService.generateATCommand(config);
      logger.info(`🔒 执行小区锁定: ${config.name} - ${command}`);

      const response = await atClient.sendCommand(command);
      
      res.json({
        success: true,
        data: {
          config: config,
          command: command,
          response: response
        },
        message: `小区锁定命令已发送: ${config.name}`,
        timestamp: new Date().toISOString()
      } as APIResponse);
    } catch (error) {
      logger.error('锁定小区失败', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  });

  // 测试AT命令生成
  router.post('/test-command/:id', (req, res) => {
    try {
      const result = customCellService.getConfigById(req.params.id);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: '配置不存在',
          timestamp: new Date().toISOString()
        } as APIResponse);
      }

      const { config } = result;
      const command = customCellService.generateATCommand(config);
      
      res.json({
        success: true,
        data: {
          config: config,
          command: command
        },
        message: 'AT命令生成成功',
        timestamp: new Date().toISOString()
      } as APIResponse);
    } catch (error) {
      logger.error('生成AT命令失败', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      } as APIResponse);
    }
  });

  return router;
}
