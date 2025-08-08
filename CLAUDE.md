# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Awesome-Graphs is a graph visualization project with the following structure:

**CURRENT ACTIVE PROJECT:**
- **`/metrics/` Directory**: Business metrics dashboard for "有效订单量" (Effective Order Volume) analysis
  - This is the main project being actively developed
  - Features hierarchical metric decomposition and dependency visualization
  - Based on real business data structure from `metrics/datas.md`

**REFERENCE MATERIALS (Root Directory):**
- **`index.html`**: Academic paper citation graph (reference implementation)
- **`papers/` directory**: Academic papers and research materials  
- Other files serve as reference for graph visualization techniques and UI patterns

## Development Environment

This is a **frontend-only project** with no build system or package management. All dependencies are loaded via CDN:
- AntV G6 (v5) for graph visualization
- Bootstrap 5.3.3 for UI components
- Fuzzy.js for search functionality

## How to Run/Test

**IMPORTANT: For the active metrics project, always use HTTP server (not file:// protocol) to ensure JSON data loading works correctly.**

1. **Metrics Dashboard (Active Project)**: 
   ```bash
   cd /Users/chenwei/Desktop/Awesome-Graphs
   python3 -m http.server 8080
   # Visit: http://localhost:8080/metrics/
   ```

2. **Reference Materials**: Can be opened directly or via HTTP server
   - Academic papers graph: `http://localhost:8080/`
   - Paper PDFs: Access via links in the graph visualization

## Architecture and Code Structure

### Main Application (`index.html`)
- **Data Structure**: Graph nodes represent papers/products with metadata (`_paper`, `_website`, `_type`)
- **Edge Relationships**: Citation relationships with optional bidirectional support (`_bidirectional`)
- **Custom G6 Components**:
  - `ClickElement` behavior: Handles node clicking and graph state management
  - `HierarchicalLayout`: Custom layout algorithm for node positioning
  - `SearchBar` plugin: Fuzzy search functionality
  - `DetailContent` plugin: Node detail display

### **Metrics Dashboard (`metrics/`) - ACTIVE PROJECT**
- **Current Focus**: "有效订单量" (Effective Order Volume) hierarchical breakdown
- **Data Sources**: 
  - Primary: `metrics/data/nodes.json` (43 nodes) and `metrics/data/edges.json` (68 edges)
  - Source specification: `metrics/datas.md` (original business requirements)
  - Fallback: Embedded data in `metrics/index.html` (10 nodes for offline viewing)
- **Node Schema**: `{id, _type, _domain, _level, _category, _weight, _description}`
- **Edge Types**: `rollup` (aggregation), `depends` (dependency), `influences` (correlation)
- **Visual System**: Color-coded by category, size by importance, hierarchical layout

### Key Features Implementation

1. **Search System**: Fuzzy matching with highlighting and scoring
2. **Graph Navigation**: Context menus for upstream/downstream analysis
3. **State Management**: Visual highlighting of related nodes/edges
4. **Responsive Layout**: Automatic layout with DAGRE algorithm
5. **Health Monitoring**: Real-time metric status with color coding

## Data Management

### **Active Project - Metrics Data (`metrics/`)**
- **Source Document**: `metrics/datas.md` - Original business requirements and hierarchy
- **Implementation**:
  - `metrics/data/nodes.json` - 43 business metrics with levels 0-6
  - `metrics/data/edges.json` - 68 relationships showing metric dependencies
  - `metrics/index.html` - Visualization logic and fallback data
- **Hierarchy Structure**:
  - Level 0: 有效订单量 (root target)
  - Level 1: DAU, 访购率, 下单频次, 笔单价 (core metrics)  
  - Level 2-6: Platform segments, user groups, channels, tools, and factors

### Reference Materials - Graph Papers Data
- **Purpose**: Technical reference for G6 implementation patterns
- **Location**: Root directory `index.html` and `/papers/` folder
- **Content**: Academic citation graphs and research papers

## Development Guidelines

### **Working on Active Metrics Project**
1. **Data Structure Updates**:
   - Primary: Modify `metrics/data/nodes.json` and `metrics/data/edges.json`
   - Always update fallback data in `metrics/index.html` for offline viewing
   - Reference `metrics/datas.md` for business requirements
   
2. **Node Schema**: `{id, _type, _domain, _level, _category, _weight, _description}`
   - `_level`: 0-6 hierarchy position (0=root target, 6=channels)
   - `_category`: business_target|core_metric|segment|platform|user_group|conversion_factor|marketing_tool
   - `_type`: metric|factor|tool
   
3. **Edge Types**: `{from, to, _type, _impact, _description}`
   - `rollup`: Child metrics aggregate to parent
   - `influences`: Factor affects metric performance  
   - `depends`: Metric depends on prerequisite condition

### Working with Reference Materials
- Root directory files provide G6 implementation patterns
- Use academic graph (`index.html`) as technical reference
- Papers in `/papers/` directory document graph algorithms and techniques

### UI Customization
- Colors and styling defined as constants at top of script sections
- G6 configuration in graph initialization
- CSS styling in `<style>` sections

## Git Workflow Preferences

Based on the global Claude instructions:
- Commit messages should be in Chinese format: `[功能类型] 具体描述`
- Auto-commit after completing programming tasks with file changes
- Create commit records at important conversation milestones