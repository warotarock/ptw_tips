
namespace BlendFileReader {

    export class BinaryReader {

        private data: DataView = null;
        private readPointer: ulong;
        private pointerBitSize: uint;
        private littleEndian: boolean = true;

        attach(data: DataView) {
            this.data = data;
            this.readPointer = 0;
        }

        setBinaryFormat(pointerBitSize: uint, littleEndian: boolean) {
            this.pointerBitSize = pointerBitSize;
            this.littleEndian = littleEndian;
        }

        getPointerBitSize(): uint {
            return this.pointerBitSize;
        }

        getPointerByteSize(): uint {
            return this.pointerBitSize / 8;
        }

        isLittleEndian(): boolean {
            return this.littleEndian;
        }

        isBigEndian(): boolean {
            return !this.littleEndian;
        }

        seek(offset: uint) {
            this.readPointer += offset;
        }

        seekTo(offset: uint) {
            this.readPointer = offset;
        }

        snapTo4ByteBoundary() {
            if ((this.readPointer % 4) != 0) {
                this.readPointer += 4 - this.readPointer % 4;
            }
        }

        readBytes(length: uint): DataView {

            let result = new DataView(this.data.buffer, this.readPointer, length);

            this.readPointer += length;

            return result;
        }

        readInt8(): char {

            let result = this.data.getInt8(this.readPointer);

            this.readPointer++;

            return result;
        }

        readInt16(): short {

            let result = this.data.getInt16(this.readPointer, this.isLittleEndian());

            this.readPointer += 2;

            return result;
        }

        readInt16Array(length: uint): List<ushort> {

            let result = new List<short>();

            for (let i = 0; i < length; i++) {

                result[i] = this.readInt16();
            }

            return result;
        }

        readUInt16(): ushort {

            let result = this.data.getUint16(this.readPointer, this.isLittleEndian());

            this.readPointer += 2;

            return result;
        }

        readUInt16Array(length: uint): List<ushort> {

            let result = new List<ushort>();

            for (let i = 0; i < length; i++) {

                result[i] = this.readUInt16();
            }

            return result;
        }

        readInt32(): int {

            let result = this.data.getInt32(this.readPointer, this.isLittleEndian());

            this.readPointer += 4;

            return result;
        }

        readInt32Array(length: uint): List<ushort> {

            let result = new List<int>();

            for (let i = 0; i < length; i++) {

                result[i] = this.readInt32();
            }

            return result;
        }

        readUInt32(): uint {

            let result = this.data.getUint32(this.readPointer, this.isLittleEndian());

            this.readPointer += 4;

            return result;
        }

        readUInt32Array(length: uint): List<ushort> {

            let result = new List<uint>();

            for (let i = 0; i < length; i++) {

                result[i] = this.readUInt32();
            }

            return result;
        }

        readUInt64(): ulong {

            let result = (this.data.getUint32(this.readPointer, this.isLittleEndian()) << 8) + this.data.getUint32(this.readPointer + 4, this.isLittleEndian());

            this.readPointer += 8;

            return result;
        }

        readUInt64Array(length: uint): List<ushort> {

            let result = new List<ulong>();

            for (let i = 0; i < length; i++) {

                result[i] = this.readUInt64();
            }

            return result;
        }

        readPointerWord(): long {

            return (this.pointerBitSize == 32 ? this.readUInt32() : this.readUInt64());
        }

        readPointerWordArray(length: uint): List<long> {

            let result = new List<long>();

            for (let i = 0; i < length; i++) {

                result[i] = this.readPointerWord();
            }

            return result;
        }

        readFloat(): float {

            let result = this.data.getFloat32(this.readPointer, this.isLittleEndian());

            this.readPointer += 4;

            return result;
        }

        readFloatArray(length: uint): List<ushort> {

            let result = new List<float>();

            for (let i = 0; i < length; i++) {

                result[i] = this.readFloat();
            }

            return result;
        }

        readStringAt(start: uint, length: uint): string {

            let buf = new Uint16Array(length);

            for (let i = 0; i < length; i++) {
                let charCode = this.data.getUint8(start + i);
                buf[i] = charCode;
            }

            let result = String.fromCharCode.apply(null, new Uint16Array(buf));

            return result;
        }

        readString(length: uint): string {

            let result = this.readStringAt(this.readPointer, length);

            this.readPointer += length;

            return result;
        }

        readNullEndingString(): string {

            let length = 0;
            while (true) {
                let charCode = this.data.getUint8(this.readPointer + length);
                if (charCode == 0) {
                    break;
                }
                length++;
            }

            let result = this.readStringAt(this.readPointer, length);

            this.readPointer += length;

            return result;
        }

        readStringSequence(stringCount: uint): List<string> {

            let result = new List<string>(stringCount);

            for (let i = 0; i < stringCount; i++) {
                let charCount = 0;
                while (true) {
                    let charCode = this.data.getUint8(this.readPointer + charCount);
                    if (charCode == 0) {
                        break;
                    }
                    charCount++;
                }

                let text = this.readStringAt(this.readPointer, charCount);
                result[i] = text;
                this.readPointer += charCount + 1;
            }

            return result;
        }
    }

    export class BlendFileHeader {

        identifier: string;
        pointer_size: string;
        endianness: string;
        version_number: string;

        read(reader: BinaryReader) {

            this.identifier = reader.readString(7);
            this.pointer_size = reader.readString(1);
            this.endianness = reader.readString(1);
            this.version_number = reader.readString(3);
        }

        isBrendFile(): boolean {
            return (this.identifier == 'BLENDER')
        }

        isBigEndian(): boolean {
            return (this.endianness == 'V')
        }

        isLittleEndian(): boolean {
            return (this.endianness == 'v')
        }

        getPointerBitSize(): uint {
            return (this.pointer_size == '_' ? 32 : 64)
        }

        getPointerByteSize(): uint {
            return (this.pointer_size == '_' ? 4 : 8)
        }
    }

    export enum BHeadBlockCodes {
        DNA1,
        ENDB,
        Other,
    }

    export class BHead {

        code: string;
        len: int;
        old: ulong;
        SDNAnr: int;
        nr: int;

        data: DataView;
        pointerBitSize: uint;
        littleEndian: boolean;
        blockCode: BHeadBlockCodes;

        read(reader: BinaryReader) {
            this.readHeader(reader);
            this.readData(reader);
        }

        readHeader(reader: BinaryReader) {

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
        }

        readData(reader: BinaryReader) {
            this.data = reader.readBytes(this.len);
        }

        skipData(reader: BinaryReader, pointerBitSize: uint) {
            reader.seek(this.len);
        }
    }

    export class StructureFieldInfo {
        name: string;
        definitionName: string;
        typeName: string;
        offset: int;
        size: uint;
        elementCount: uint;
        isStructure: boolean;
        isPointer: boolean;
    }

    export class StructureTypeInfo {
        name: string;
        sdnaIndex: uint;
        fieldInfos: Dictionary<StructureFieldInfo> = {};
        fieldInfoList = new List<StructureFieldInfo>();
        datasetPrototype: (Function | any) = (function () { });
    }

    export class SDNADataSet {
        bhead: BHead;
        baseOffset: uint;
        reader: BinaryReader;
        elementCount: uint;
    }

    export class DNA {

        structureTypeInfos: Dictionary<StructureTypeInfo> = new Dictionary<StructureTypeInfo>();
        structureTypeInfoList = new List<StructureTypeInfo>();
        reader = new BinaryReader();

        parse(reader: BinaryReader) {

            // 'SDNA'
            let sdna_Identifier = reader.readString(4);

            // 'NAME'
            let name_Identifier = reader.readString(4);
            let nameCount = reader.readUInt32();
            let nameList = reader.readStringSequence(nameCount);
            reader.snapTo4ByteBoundary();

            // 'TYPE'
            let type_Identifier = reader.readString(4);
            let typeCount = reader.readUInt32();
            let typeList = reader.readStringSequence(typeCount);
            reader.snapTo4ByteBoundary();

            // 'TLEN
            let tlen_Identifier = reader.readString(4);
            let lengthList = reader.readUInt16Array(typeCount);
            reader.snapTo4ByteBoundary();

            // 'STRC
            let strc_Identifier = reader.readString(4);
            let structureCount = reader.readUInt32();

            for (let i = 0; i < structureCount; i++) {

                let typeNameIndex = reader.readUInt16();
                let fields = reader.readUInt16();

                let structureInfo = new StructureTypeInfo();
                structureInfo.name = typeList[typeNameIndex];
                structureInfo.sdnaIndex = i;

                this.structureTypeInfoList.push(structureInfo);
                this.structureTypeInfos[structureInfo.name] = structureInfo;

                let offset = 0;
                for (let k = 0; k < fields; k++) {
                    let filedTypeIndex = reader.readUInt16();
                    let filedNameIndex = reader.readUInt16();

                    let fieldInfo = this.createStructureFieldInfo(
                        typeList[filedTypeIndex]
                        , nameList[filedNameIndex]
                        , lengthList[filedTypeIndex]
                        , reader.getPointerByteSize()
                        , offset);

                    structureInfo.fieldInfoList.push(fieldInfo);
                    structureInfo.fieldInfos[fieldInfo.name] = fieldInfo;

                    offset += fieldInfo.size;
                }
            }

            // フィールドが構造体であるかの設定
            for (let i = 0; i < this.structureTypeInfoList.length; i++) {
                let typeInfo = this.structureTypeInfoList[i];

                for (let k = 0; k < typeInfo.fieldInfoList.length; k++) {
                    let fieldInfo = typeInfo.fieldInfoList[k];

                    fieldInfo.isStructure = (!fieldInfo.isPointer && (fieldInfo.typeName in this.structureTypeInfos));
                }
            }

            // 構造体のプロトタイプの生成
            this.initializeStructurePrototypes();
        }

        private createStructureFieldInfo(typeName: string, definitionName: string, size: uint, pointerByteSize: uint, offset: uint): StructureFieldInfo {

            let isPointer = false;
            if (definitionName.indexOf('*') != -1) {
                size = pointerByteSize;
                isPointer = true;
            }

            let elementCount = this.getElementCountFromName(definitionName);

            let identifierName = this.getIdentifierName(definitionName);

            let result = new StructureFieldInfo();
            result.name = identifierName;
            result.definitionName = definitionName;
            result.typeName = typeName;
            result.offset = offset;
            result.size = elementCount * size;
            result.elementCount = elementCount;
            result.isPointer = isPointer;
            result.isStructure = true;

            return result;
        }

        private initializeStructurePrototypes() {

            for (let i = 0; i < this.structureTypeInfoList.length; i++) {
                let typeInfo = this.structureTypeInfoList[i];

                for (let k = 0; k < typeInfo.fieldInfoList.length; k++) {
                    let fieldInfo = typeInfo.fieldInfoList[k];
                    this.defineStructureProperty(typeInfo, fieldInfo);
                }
            }
        }

        private defineStructureProperty(typeInfo: StructureTypeInfo, fieldInfo: StructureFieldInfo) {

            let dna = this;
            let fieldValuePropertyName = '_' + fieldInfo.name;

            if (fieldInfo.isStructure) {
                // 構造体であるメンバにアクセスするプロパティの定義
                Object.defineProperty(typeInfo.datasetPrototype.prototype, fieldInfo.name, {
                    get: function () {

                        let dataSet: (SDNADataSet | any) = this;

                        // プロパティの実体を取得
                        // プロパティの実体が作成されていなければ作成
                        let property_DataSet: SDNADataSet;

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

                        let dataSet: (SDNADataSet | any) = this;

                        // プロパティの値を取得またはプロパティの値が作成されていなければ作成
                        if (fieldValuePropertyName in dataSet) {
                            return dataSet[fieldValuePropertyName];
                        }
                        else {

                            dataSet.reader.seekTo(dataSet.baseOffset + fieldInfo.offset);

                            let value: any;
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
        }

        getElementCountFromName(definitionName: string): uint {

            if (definitionName.indexOf('[') == -1) {
                return 1;
            }
            let regex = new RegExp('\[[0-9]+\]', 'g');
            let maches = definitionName.match(regex);

            let count = 1;
            for (let i = 0; i < maches.length; i++) {
                let mach = maches[i];
                count *= Number(mach.substr(1, mach.length - 2));
            }

            return count;
        }

        getIdentifierName(definitionName: string): string {

            let startIndex = definitionName.lastIndexOf('*');
            if (startIndex == -1) {
                startIndex = 0;
            }
            else {
                startIndex = startIndex + 1;
            }

            let endIndex = definitionName.indexOf('[');
            if (endIndex == -1) {
                endIndex = definitionName.length;
            }
            else {
                endIndex = endIndex;
            }

            return definitionName.substring(startIndex, endIndex);
        }

        getSDNAIndex(name: string): uint {

            if (name in this.structureTypeInfos) {
                let typeInfo: StructureTypeInfo = this.structureTypeInfos[name];
                return typeInfo.sdnaIndex;
            }
            else {
                return -1;
            }
        }

        getStructureTypeInfo(name: string): StructureTypeInfo {

            if (name in this.structureTypeInfos) {
                return this.structureTypeInfos[name];
            }
            else {
                return undefined;
            }
        }

        getStructureTypeInfoByID(sdnaIndex: uint): StructureTypeInfo {

            return this.structureTypeInfoList[sdnaIndex];
        }

        createDataSet(bHead: BHead): SDNADataSet | any {

            let typeInfo = this.getStructureTypeInfoByID(bHead.SDNAnr)

            let dataSet = this.createDataSetFromTypeInfo(typeInfo, bHead, 0);

            // accessor like array in a data block
            if (typeInfo.sdnaIndex == 0) {
                dataSet.elementCount = bHead.len / (bHead.pointerBitSize / 8);
                for (let i = 0; i < dataSet.elementCount; i++) {
                    dataSet[i] = dataSet.reader.readPointerWord();
                }
            }
            else {
                for (let i = 0; i < dataSet.elementCount; i++) {
                    if (i == 0) {
                        dataSet[i] = dataSet;
                    }
                    else {
                        let offset = i * bHead.len / bHead.nr;
                        dataSet[i] = this.createDataSetFromTypeInfo(typeInfo, bHead, offset);
                    }
                }
            }

            return dataSet;
        }

        createDataSetFromTypeInfo(typeInfo: StructureTypeInfo, bHead: BHead, offset: uint): SDNADataSet {

            let dataSet: SDNADataSet = new typeInfo.datasetPrototype();
            dataSet.bhead = bHead;
            dataSet.baseOffset = offset;
            dataSet.elementCount = bHead.nr;
            dataSet.reader = new BinaryReader();
            dataSet.reader.setBinaryFormat(bHead.pointerBitSize, bHead.littleEndian);
            dataSet.reader.attach(bHead.data);

            return dataSet;
        }
    }

    export class ReadBlendFileResult {

        fileHeader: BlendFileHeader = null;
        bheadList: List<BHead> = null;
        dna: DNA = null;
    }

    export function readBlendFile(arrayBuffer: ArrayBuffer): ReadBlendFileResult {

        // ファイルヘッダの読み込みとリーダーの設定
        let reader = new BinaryReader();
        reader.attach(new DataView(arrayBuffer));

        let blenderFileHeader = new BlendFileHeader();
        blenderFileHeader.read(reader);

        reader.setBinaryFormat(blenderFileHeader.getPointerBitSize(), blenderFileHeader.isLittleEndian());

        let bHeadDataReader = new BinaryReader();
        bHeadDataReader.setBinaryFormat(blenderFileHeader.getPointerBitSize(), blenderFileHeader.isLittleEndian());

        // 全てのブロックの読み込み
        let bHeadList = new List<BHead>();
        let dna = new DNA();
        let i = 0;
        while (true) {

            let bHead = new BHead();
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
        let result = new ReadBlendFileResult();
        result.fileHeader = blenderFileHeader;
        result.bheadList = bHeadList;
        result.dna = dna;

        return result;
    }
}
