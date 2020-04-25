import { DiskRepository } from './disk';

/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export interface Template {
  id: string;
  name: string;
  description: string;
  ownerId: string;
}

export abstract class RepositoryBase {
  abstract async list(): Promise<Template[]>;
  abstract async reindex(): Promise<void>;
  // returns a directory to run cookiecutter in
  abstract async prepare(id: string): Promise<string>;
}

class Interface implements RepositoryBase {
  repo?: RepositoryBase;

  constructor() {
    this.repo = new DiskRepository();
  }

  public setRepository(repo: RepositoryBase) {
    this.repo = repo;
  }

  list = () => this.repo!.list();
  prepare = (id: string) => this.repo!.prepare(id);
  reindex = () => this.repo!.reindex();
}

export const Repository = new Interface();