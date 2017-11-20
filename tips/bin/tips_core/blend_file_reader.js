var BlendFileReader;
(function (BlendFileReader) {
    var BinaryReader = (function () {
        function BinaryReader() {
            this.data = null;
            this.littleEndian = true;
        }
        BinaryReader.prototype.attach = function (data) {
            this.data = data;
            this.readPointer = 0;
        };
        BinaryReader.prototype.setBinaryFormat = function (pointerBitSize, littleEndian) {
            this.pointerBitSize = pointerBitSize;
            this.littleEndian = littleEndian;
        };
        BinaryReader.prototype.getPointerBitSize = function () {
            return this.pointerBitSize;
        };
        BinaryReader.prototype.getPointerByteSize = function () {
            return this.pointerBitSize / 8;
        };
        BinaryReader.prototype.isLittleEndian = function () {
            return this.littleEndian;
        };
        BinaryReader.prototype.isBigEndian = function () {
            return !this.littleEndian;
        };
        BinaryReader.prototype.seek = function (offset) {
            this.readPointer += offset;
        };
        BinaryReader.prototype.seekTo = function (offset) {
            this.readPointer = offset;
        };
        BinaryReader.prototype.snapTo4ByteBoundary = function () {
            if ((this.readPointer % 4) != 0) {
                this.readPointer += 4 - this.readPointer % 4;
            }
        };
        BinaryReader.prototype.readBytes = function (length) {
            var result = new DataView(this.data.buffer, this.readPointer, length);
            this.readPointer += length;
            return result;
        };
        BinaryReader.prototype.readInt8 = function () {
            var result = this.data.getInt8(this.readPointer);
            this.readPointer++;
            return result;
        };
        BinaryReader.prototype.readInt16 = function () {
            var result = this.data.getInt16(this.readPointer, this.isLittleEndian());
            this.readPointer += 2;
            return result;
        };
        BinaryReader.prototype.readInt16Array = function (length) {
            var result = new List();
            for (var i = 0; i < length; i++) {
                result[i] = this.readInt16();
            }
            return result;
        };
        BinaryReader.prototype.readUInt16 = function () {
            var result = this.data.getUint16(this.readPointer, this.isLittleEndian());
            this.readPointer += 2;
            return result;
        };
        BinaryReader.prototype.readUInt16Array = function (length) {
            var result = new List();
            for (var i = 0; i < length; i++) {
                result[i] = this.readUInt16();
            }
            return result;
        };
        BinaryReader.prototype.readInt32 = function () {
            var result = this.data.getInt32(this.readPointer, this.isLittleEndian());
            this.readPointer += 4;
            return result;
        };
        BinaryReader.prototype.readInt32Array = function (length) {
            var result = new List();
            for (var i = 0; i < length; i++) {
                result[i] = this.readInt32();
            }
            return result;
        };
        BinaryReader.prototype.readUInt32 = function () {
            var result = this.data.getUint32(this.readPointer, this.isLittleEndian());
            this.readPointer += 4;
            return result;
        };
        BinaryReader.prototype.readUInt32Array = function (length) {
            var result = new List();
            for (var i = 0; i < length; i++) {
                result[i] = this.readUInt32();
            }
            return result;
        };
        BinaryReader.prototype.readUInt64 = function () {
            var result = (this.data.getUint32(this.readPointer, this.isLittleEndian()) << 8) + this.data.getUint32(this.readPointer + 4, this.isLittleEndian());
            this.readPointer += 8;
            return result;
        };
        BinaryReader.prototype.readUInt64Array = function (length) {
            var result = new List();
            for (var i = 0; i < length; i++) {
                result[i] = this.readUInt64();
            }
            return result;
        };
        BinaryReader.prototype.readPointerWord = function () {
            return (this.pointerBitSize == 32 ? this.readUInt32() : this.readUInt64());
        };
        BinaryReader.prototype.readPointerWordArray = function (length) {
            var result = new List();
            for (var i = 0; i < length; i++) {
                result[i] = this.readPointerWord();
            }
            return result;
        };
        BinaryReader.prototype.readFloat = function () {
            var result = this.data.getFloat32(this.readPointer, this.isLittleEndian());
            this.readPointer += 4;
            return result;
        };
        BinaryReader.prototype.readFloatArray = function (length) {
            var result = new List();
            for (var i = 0; i < length; i++) {
                result[i] = this.readFloat();
            }
            return result;
        };
        BinaryReader.prototype.readStringAt = function (start, length) {
            var buf = new Uint16Array(length);
            for (var i = 0; i < length; i++) {
                var charCode = this.data.getUint8(start + i);
                buf[i] = charCode;
            }
            var result = String.fromCharCode.apply(null, new Uint16Array(buf));
            return result;
        };
        BinaryReader.prototype.readString = function (length) {
            var result = this.readStringAt(this.readPointer, length);
            this.readPointer += length;
            return result;
        };
        BinaryReader.prototype.readNullEndingString = function () {
            var length = 0;
            while (true) {
                var charCode = this.data.getUint8(this.readPointer + length);
                if (charCode == 0) {
                    break;
                }
                length++;
            }
            var result = this.readStringAt(this.readPointer, length);
            this.readPointer += length;
            return result;
        };
        BinaryReader.prototype.readStringList = function (stringCount) {
            var result = new List(stringCount);
            for (var i = 0; i < stringCount; i++) {
                var charCount = 0;
                while (true) {
                    var charCode = this.data.getUint8(this.readPointer + charCount);
                    if (charCode == 0) {
                        break;
                    }
                    charCount++;
                }
                var text = this.readStringAt(this.readPointer, charCount);
                result[i] = text;
                this.readPointer += charCount + 1;
            }
            return result;
        };
        return BinaryReader;
    }());
    BlendFileReader.BinaryReader = BinaryReader;
    var BlendFileHeader = (function () {
        function BlendFileHeader() {
        }
        BlendFileHeader.prototype.read = function (reader) {
            this.identifier = reader.readString(7);
            this.pointer_size = reader.readString(1);
            this.endianness = reader.readString(1);
            this.version_number = reader.readString(3);
        };
        BlendFileHeader.prototype.isBrendFile = function () {
            return (this.identifier == 'BLENDER');
        };
        BlendFileHeader.prototype.isBigEndian = function () {
            return (this.endianness == 'V');
        };
        BlendFileHeader.prototype.isLittleEndian = function () {
            return (this.endianness == 'v');
        };
        BlendFileHeader.prototype.getPointerBitSize = function () {
            return (this.pointer_size == '_' ? 32 : 64);
        };
        BlendFileHeader.prototype.getPointerByteSize = function () {
            return (this.pointer_size == '_' ? 4 : 8);
        };
        return BlendFileHeader;
    }());
    BlendFileReader.BlendFileHeader = BlendFileHeader;
    var BHeadBlockCodes;
    (function (BHeadBlockCodes) {
        BHeadBlockCodes[BHeadBlockCodes["DNA1"] = 0] = "DNA1";
        BHeadBlockCodes[BHeadBlockCodes["ENDB"] = 1] = "ENDB";
        BHeadBlockCodes[BHeadBlockCodes["Other"] = 2] = "Other";
    })(BHeadBlockCodes = BlendFileReader.BHeadBlockCodes || (BlendFileReader.BHeadBlockCodes = {}));
    var BHead = (function () {
        function BHead() {
        }
        BHead.prototype.read = function (reader) {
            this.readHeader(reader);
            this.readData(reader);
        };
        BHead.prototype.readHeader = function (reader) {
            this.code = reader.readString(4);
            this.len = reader.readUInt32();
            this.old = reader.readPointerWord();
            this.SDNAnr = reader.readUInt32();
            this.nr = reader.readUInt32();
            this.data = null;
            this.pointerBitSize = reader.getPointerBitSize();
            this.littleEndian = reader.isLittleEndian();
            if (this.code == 'DNA1') {
                this.blockCode = BHeadBlockCodes.DNA1;
            }
            else if (this.code == 'ENDB') {
                this.blockCode = BHeadBlockCodes.ENDB;
            }
            else {
                this.blockCode = BHeadBlockCodes.Other;
            }
        };
        BHead.prototype.readData = function (reader) {
            this.data = reader.readBytes(this.len);
        };
        BHead.prototype.skipData = function (reader, pointerBitSize) {
            reader.seek(this.len);
        };
        return BHead;
    }());
    BlendFileReader.BHead = BHead;
    var StructureFieldInfo = (function () {
        function StructureFieldInfo() {
        }
        return StructureFieldInfo;
    }());
    BlendFileReader.StructureFieldInfo = StructureFieldInfo;
    var StructureTypeInfo = (function () {
        function StructureTypeInfo() {
            this.fieldInfos = {};
            this.fieldInfoList = new List();
            this.datasetPrototype = (function () { });
        }
        return StructureTypeInfo;
    }());
    BlendFileReader.StructureTypeInfo = StructureTypeInfo;
    var SDNADataSet = (function () {
        function SDNADataSet() {
        }
        return SDNADataSet;
    }());
    BlendFileReader.SDNADataSet = SDNADataSet;
    var DNA = (function () {
        function DNA() {
            this.structureTypeInfos = new Dictionary();
            this.structureTypeInfoList = new List();
            this.reader = new BinaryReader();
        }
        DNA.prototype.parse = function (reader) {
            // 'SDNA'
            var sdna_Identifier = reader.readString(4);
            // 'NAME'
            var name_Identifier = reader.readString(4);
            var nameCount = reader.readUInt32();
            var nameList = reader.readStringList(nameCount);
            reader.snapTo4ByteBoundary();
            // 'TYPE'
            var type_Identifier = reader.readString(4);
            var typeCount = reader.readUInt32();
            var typeList = reader.readStringList(typeCount);
            reader.snapTo4ByteBoundary();
            // 'TLEN
            var tlen_Identifier = reader.readString(4);
            var lengthList = reader.readUInt16Array(typeCount);
            reader.snapTo4ByteBoundary();
            // 'STRC
            var strc_Identifier = reader.readString(4);
            var structureCount = reader.readUInt32();
            for (var sdnaIndex = 0; sdnaIndex < structureCount; sdnaIndex++) {
                var typeNameIndex = reader.readUInt16();
                var fields = reader.readUInt16();
                var structureInfo = new StructureTypeInfo();
                structureInfo.name = typeList[typeNameIndex];
                structureInfo.sdnaIndex = sdnaIndex;
                this.structureTypeInfoList.push(structureInfo);
                this.structureTypeInfos[structureInfo.name] = structureInfo;
                var offset = 0;
                for (var fieldCount = 0; fieldCount < fields; fieldCount++) {
                    var filedTypeIndex = reader.readUInt16();
                    var filedNameIndex = reader.readUInt16();
                    var fieldInfo = this.createStructureFieldInfo(typeList[filedTypeIndex], nameList[filedNameIndex], lengthList[filedTypeIndex], reader.getPointerByteSize(), offset);
                    structureInfo.fieldInfoList.push(fieldInfo);
                    structureInfo.fieldInfos[fieldInfo.name] = fieldInfo;
                    offset += fieldInfo.size;
                }
            }
            // フィールドが構造体であるかの設定
            for (var _i = 0, _a = this.structureTypeInfoList; _i < _a.length; _i++) {
                var typeInfo = _a[_i];
                for (var _b = 0, _c = typeInfo.fieldInfoList; _b < _c.length; _b++) {
                    var fieldInfo = _c[_b];
                    fieldInfo.isStructure = (!fieldInfo.isPointer && (fieldInfo.typeName in this.structureTypeInfos));
                }
            }
            // 構造体のプロトタイプの生成
            this.initializeStructurePrototypes();
        };
        DNA.prototype.createStructureFieldInfo = function (typeName, definitionName, size, pointerByteSize, offset) {
            var isPointer = false;
            if (definitionName.indexOf('*') != -1) {
                size = pointerByteSize;
                isPointer = true;
            }
            var elementCount = this.getElementCountFromName(definitionName);
            var identifierName = this.getIdentifierName(definitionName);
            var result = new StructureFieldInfo();
            result.name = identifierName;
            result.definitionName = definitionName;
            result.typeName = typeName;
            result.offset = offset;
            result.size = elementCount * size;
            result.elementCount = elementCount;
            result.isPointer = isPointer;
            result.isStructure = true;
            return result;
        };
        DNA.prototype.initializeStructurePrototypes = function () {
            for (var _i = 0, _a = this.structureTypeInfoList; _i < _a.length; _i++) {
                var typeInfo = _a[_i];
                for (var _b = 0, _c = typeInfo.fieldInfoList; _b < _c.length; _b++) {
                    var fieldInfo = _c[_b];
                    this.defineStructureProperty(typeInfo, fieldInfo);
                }
            }
        };
        DNA.prototype.defineStructureProperty = function (typeInfo, fieldInfo) {
            var dna = this;
            var fieldValuePropertyName = '_' + fieldInfo.name;
            if (fieldInfo.isStructure) {
                // 構造体であるメンバにアクセスするプロパティの定義
                Object.defineProperty(typeInfo.datasetPrototype.prototype, fieldInfo.name, {
                    get: function () {
                        var dataSet = this;
                        // プロパティの実体を取得
                        // プロパティの実体が作成されていなければ作成
                        var property_DataSet;
                        if (fieldValuePropertyName in dataSet) {
                            property_DataSet = dataSet[fieldValuePropertyName];
                        }
                        else {
                            property_DataSet = dna.createDataSetFromTypeInfo(dna.structureTypeInfos[fieldInfo.typeName], dataSet.bhead, fieldInfo.offset);
                            dataSet[fieldValuePropertyName] = property_DataSet;
                        }
                        return property_DataSet;
                    },
                    enumerable: true,
                    configurable: false
                });
            }
            else {
                // プリミティブ型であるメンバにアクセスするプロパティの定義
                Object.defineProperty(typeInfo.datasetPrototype.prototype, fieldInfo.name, {
                    get: function () {
                        var dataSet = this;
                        // プロパティの値を取得またはプロパティの値が作成されていなければ作成
                        if (fieldValuePropertyName in dataSet) {
                            return dataSet[fieldValuePropertyName];
                        }
                        else {
                            dataSet.reader.seekTo(dataSet.baseOffset + fieldInfo.offset);
                            var value = void 0;
                            if (fieldInfo.isPointer) {
                                if (fieldInfo.elementCount == 1) {
                                    value = dataSet.reader.readPointerWord();
                                }
                                else {
                                    value = dataSet.reader.readPointerWordArray(fieldInfo.elementCount);
                                }
                            }
                            else if (fieldInfo.typeName == 'float') {
                                if (fieldInfo.elementCount == 1) {
                                    value = dataSet.reader.readFloat();
                                }
                                else {
                                    value = dataSet.reader.readFloatArray(fieldInfo.elementCount);
                                }
                            }
                            else if (fieldInfo.typeName == 'int') {
                                if (fieldInfo.elementCount == 1) {
                                    value = dataSet.reader.readInt32();
                                }
                                else {
                                    value = dataSet.reader.readInt32Array(fieldInfo.elementCount);
                                }
                            }
                            else if (fieldInfo.typeName == 'short') {
                                if (fieldInfo.elementCount == 1) {
                                    value = dataSet.reader.readInt16();
                                }
                                else {
                                    value = dataSet.reader.readInt16Array(fieldInfo.elementCount);
                                }
                            }
                            else if (fieldInfo.typeName == 'char') {
                                if (fieldInfo.elementCount == 1) {
                                    value = dataSet.reader.readInt8();
                                }
                                else {
                                    value = dataSet.reader.readNullEndingString();
                                }
                            }
                            else {
                                value = undefined;
                            }
                            dataSet[fieldValuePropertyName] = value;
                            return value;
                        }
                    },
                    enumerable: false,
                    configurable: false
                });
            }
        };
        DNA.prototype.getElementCountFromName = function (definitionName) {
            if (definitionName.indexOf('[') == -1) {
                return 1;
            }
            var regex = new RegExp('\[[0-9]+\]', 'g');
            var maches = definitionName.match(regex);
            var count = 1;
            for (var i = 0; i < maches.length; i++) {
                var mach = maches[i];
                count *= Number(mach.substr(1, mach.length - 2));
            }
            return count;
        };
        DNA.prototype.getIdentifierName = function (definitionName) {
            var startIndex = definitionName.lastIndexOf('*');
            if (startIndex == -1) {
                startIndex = 0;
            }
            else {
                startIndex = startIndex + 1;
            }
            var endIndex = definitionName.indexOf('[');
            if (endIndex == -1) {
                endIndex = definitionName.length;
            }
            else {
                endIndex = endIndex;
            }
            return definitionName.substring(startIndex, endIndex);
        };
        DNA.prototype.getSDNAIndex = function (name) {
            if (DictionaryContainsKey(this.structureTypeInfos, name)) {
                var typeInfo = this.structureTypeInfos[name];
                return typeInfo.sdnaIndex;
            }
            else {
                return -1;
            }
        };
        DNA.prototype.getStructureTypeInfo = function (name) {
            if (DictionaryContainsKey(this.structureTypeInfos, name)) {
                return this.structureTypeInfos[name];
            }
            else {
                return undefined;
            }
        };
        DNA.prototype.getStructureTypeInfoByID = function (sdnaIndex) {
            return this.structureTypeInfoList[sdnaIndex];
        };
        DNA.prototype.createDataSet = function (bHead) {
            var typeInfo = this.getStructureTypeInfoByID(bHead.SDNAnr);
            var dataSet = this.createDataSetFromTypeInfo(typeInfo, bHead, 0);
            // accessor like array in a data block
            if (typeInfo.sdnaIndex == 0) {
                dataSet.elementCount = bHead.len / (bHead.pointerBitSize / 8);
                for (var i = 0; i < dataSet.elementCount; i++) {
                    dataSet[i] = dataSet.reader.readPointerWord();
                }
            }
            else {
                for (var i = 0; i < dataSet.elementCount; i++) {
                    if (i == 0) {
                        dataSet[i] = dataSet;
                    }
                    else {
                        var offset = i * bHead.len / bHead.nr;
                        dataSet[i] = this.createDataSetFromTypeInfo(typeInfo, bHead, offset);
                    }
                }
            }
            return dataSet;
        };
        DNA.prototype.createDataSetFromTypeInfo = function (typeInfo, bHead, offset) {
            var dataSet = new typeInfo.datasetPrototype();
            dataSet.bhead = bHead;
            dataSet.baseOffset = offset;
            dataSet.elementCount = bHead.nr;
            dataSet.reader = new BinaryReader();
            dataSet.reader.setBinaryFormat(bHead.pointerBitSize, bHead.littleEndian);
            dataSet.reader.attach(bHead.data);
            return dataSet;
        };
        return DNA;
    }());
    BlendFileReader.DNA = DNA;
    var ReadBlendFileResult = (function () {
        function ReadBlendFileResult() {
            this.fileHeader = null;
            this.bheadList = null;
            this.dna = null;
        }
        return ReadBlendFileResult;
    }());
    BlendFileReader.ReadBlendFileResult = ReadBlendFileResult;
    function readBlendFile(arrayBuffer) {
        // ファイルヘッダの読み込みとリーダーの設定
        var reader = new BinaryReader();
        reader.attach(new DataView(arrayBuffer));
        var blenderFileHeader = new BlendFileHeader();
        blenderFileHeader.read(reader);
        reader.setBinaryFormat(blenderFileHeader.getPointerBitSize(), blenderFileHeader.isLittleEndian());
        var bHeadDataReader = new BinaryReader();
        bHeadDataReader.setBinaryFormat(blenderFileHeader.getPointerBitSize(), blenderFileHeader.isLittleEndian());
        // 全てのブロックの読み込み
        var bHeadList = new List();
        var dna = new DNA();
        var i = 0;
        while (true) {
            var bHead = new BHead();
            bHead.read(reader);
            if (bHead.blockCode == BHeadBlockCodes.DNA1) {
                bHeadDataReader.attach(bHead.data);
                dna.parse(bHeadDataReader);
            }
            else if (bHead.blockCode == BHeadBlockCodes.ENDB) {
                break;
            }
            else {
                bHeadList.push(bHead);
            }
        }
        // 結果を返却
        var result = new ReadBlendFileResult();
        result.fileHeader = blenderFileHeader;
        result.bheadList = bHeadList;
        result.dna = dna;
        return result;
    }
    BlendFileReader.readBlendFile = readBlendFile;
})(BlendFileReader || (BlendFileReader = {}));
