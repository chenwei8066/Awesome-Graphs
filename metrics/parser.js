// Markdown层次结构解析器 - 将datas.md转换为图数据
class MarkdownParser {
  constructor() {
    this.nodes = [];
    this.edges = [];
    this.nodeIdCounter = 0;
  }

  // 解析Markdown文本为图数据
  parse(markdownText) {
    this.nodes = [];
    this.edges = [];
    this.nodeIdCounter = 0;

    const lines = markdownText.split('\n');
    const hierarchyStack = []; // 存储层次结构栈
    let lastHeaderLevel = -1; // 记录最后一个标题的层级

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let level = this.getMarkdownLevel(line);
      if (level === -1) continue;

      // 如果是列表项，需要相对于最近的标题层级计算
      const isListItem = line.match(/^(\s*)-\s/);
      if (isListItem) {
        // 计算缩进级别，每2个空格为一层缩进
        const indentSpaces = isListItem[1].length;
        const indentLevel = Math.floor(indentSpaces / 2);
        
        if (lastHeaderLevel >= 0) {
          level = lastHeaderLevel + 1 + indentLevel; // 相对于最近标题的层级
        } else {
          level = indentLevel + 1; // 如果没有标题，从层级1开始
        }
        
      } else if (line.match(/^#{1,7}\s/)) {
        // 只有标题行才更新lastHeaderLevel
        lastHeaderLevel = level;
      }

      const content = this.extractContent(line);
      if (!content) continue;

      // 清理栈，保持层次关系
      while (hierarchyStack.length > level) {
        hierarchyStack.pop();
      }

      // 创建节点
      const node = this.createNode(content, level, hierarchyStack);
      this.nodes.push(node);

      // 创建与直接父节点的连接
      if (level > 0) {
        // 找到正确的父节点：层级为level-1的最近节点
        let parentNode = null;
        for (let i = level - 1; i >= 0; i--) {
          if (hierarchyStack[i] && hierarchyStack[i].id) {
            parentNode = hierarchyStack[i];
            break;
          }
        }
        
        if (parentNode) {
          const edge = this.createEdge(parentNode.id, node.id, level);
          this.edges.push(edge);
        }
      }

      // 正确更新层次栈：确保当前节点放在正确的层级位置
      while (hierarchyStack.length <= level) {
        hierarchyStack.push(null);
      }
      hierarchyStack[level] = node;
    }

    return {
      nodes: this.nodes,
      edges: this.edges
    };
  }

  // 获取Markdown标题级别
  getMarkdownLevel(line) {
    const headerMatch = line.match(/^(#{1,7})\s/);
    if (headerMatch) {
      return headerMatch[1].length - 1; // 转换为0-based层级
    }

    const listMatch = line.match(/^(\s*)-\s/);
    if (listMatch) {
      // 计算缩进层级，每2个空格为一层
      const indentLevel = Math.floor(listMatch[1].length / 2);
      return indentLevel + 1; // 列表项比标题低一级
    }

    return -1;
  }

  // 提取内容文本
  extractContent(line) {
    // 提取标题内容
    const headerMatch = line.match(/^#{1,7}\s+(.+)/);
    if (headerMatch) {
      let content = headerMatch[1].trim();
      // 清理编号前缀 (如 "1. DAU" -> "DAU", "1.1.1 分端-ET" -> "分端-ET")
      content = content.replace(/^\d+(\.\d+)*\.?\s*/, '');
      return content;
    }

    // 提取列表项内容
    const listMatch = line.match(/^(\s*)-\s+(.+)/);
    if (listMatch) {
      return listMatch[2].trim();
    }

    return null;
  }

  // 创建节点
  createNode(content, level, hierarchyStack) {
    // 确保节点ID唯一，如果重复则添加路径前缀
    let id = content;
    const existingNode = this.nodes.find(n => n.id === id);
    if (existingNode) {
      // 基于层次栈构建唯一路径
      const pathParts = hierarchyStack.filter(n => n && n.id).map(n => n.id);
      if (pathParts.length > 0) {
        id = `${pathParts[pathParts.length - 1]}-${content}`;
      } else {
        // 如果没有父节点，用层级前缀
        id = `L${level}-${content}`;
      }
      
      // 如果还是重复，添加计数器
      let counter = 1;
      let finalId = id;
      while (this.nodes.find(n => n.id === finalId)) {
        finalId = `${id}-${counter}`;
        counter++;
      }
      id = finalId;
    }
    const nodeType = this.determineNodeType(content, level);
    const category = this.determineCategory(content, level, hierarchyStack);
    const domain = this.determineDomain(content, level, hierarchyStack);

    return {
      id: id,
      _type: nodeType,
      _domain: domain,
      _level: level,
      _category: category,
      _weight: this.calculateWeight(level),
      _description: this.generateDescription(content, level)
    };
  }

  // 创建边
  createEdge(fromId, toId, level) {
    const edgeType = this.determineEdgeType(level);
    return {
      from: fromId,
      to: toId,
      _type: edgeType,
      _impact: this.calculateImpact(level),
      _description: `${fromId}对${toId}的${edgeType === 'rollup' ? '聚合' : '影响'}关系`
    };
  }

  // 确定节点类型
  determineNodeType(content, level) {
    if (level === 0) return 'metric';
    if (level <= 2) return 'metric';
    if (content.includes('渠道') || content.includes('工具')) return 'tool';
    if (content.includes('补贴') || content.includes('体验') || content.includes('丰富度')) return 'factor';
    return 'metric';
  }

  // 确定节点分类
  determineCategory(content, level, hierarchyStack) {
    if (level === 0) return 'business_target';
    if (level === 1) return 'core_metric';
    if (level === 2) return 'segment';
    if (level === 3) return 'platform';
    if (level === 4) return 'user_group';
    if (level >= 5 && content.includes('渠道')) return 'channel';
    if (content.includes('补贴') || content.includes('丰富度') || content.includes('体验')) return 'conversion_factor';
    if (content.includes('工具') || content.includes('红包') || content.includes('券')) return 'marketing_tool';
    return 'user_type';
  }

  // 确定业务域
  determineDomain(content, level, hierarchyStack) {
    if (level === 0) return '核心';
    if (content.includes('DAU')) return '用户';
    if (content.includes('访购率') || content.includes('转化')) return '转化';
    if (content.includes('频次')) return '行为';
    if (content.includes('单价')) return '收益';
    if (content.includes('闪购')) return '闪购';
    if (content.includes('非闪购') || content.includes('饿了么') || content.includes('微信')) return '非闪购';
    if (content.includes('营销') || content.includes('补贴')) return '营销';
    if (content.includes('供给') || content.includes('商户') || content.includes('商品')) return '供给';
    if (content.includes('物流') || content.includes('体验')) return '履约';
    
    // 根据父节点推断域
    if (hierarchyStack.length > 0) {
      const parent = hierarchyStack[hierarchyStack.length - 1];
      return (parent && parent._domain) || '其他';
    }
    
    return '其他';
  }

  // 确定边类型
  determineEdgeType(level) {
    if (level <= 2) return 'rollup';  // 核心指标聚合关系
    if (level >= 5) return 'influences'; // 底层因素影响关系
    return 'depends'; // 中层依赖关系
  }

  // 计算权重
  calculateWeight(level) {
    const weights = [1.0, 0.9, 0.7, 0.6, 0.4, 0.3, 0.2];
    return weights[level] || 0.1;
  }

  // 计算影响力
  calculateImpact(level) {
    const impacts = [0.25, 0.4, 0.35, 0.3, 0.25, 0.2];
    return impacts[level] || 0.1;
  }

  // 生成描述
  generateDescription(content, level) {
    const descriptions = {
      0: '业务核心目标',
      1: '核心业务指标',
      2: '业务细分指标',
      3: '平台/渠道指标',
      4: '用户群体指标',
      5: '具体因素或工具',
      6: '底层操作要素'
    };
    
    return descriptions[level] || '业务要素';
  }
}

// 导出解析器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkdownParser;
} else {
  window.MarkdownParser = MarkdownParser;
}